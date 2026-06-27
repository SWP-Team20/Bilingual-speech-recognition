# -*- coding: utf-8 -*-
"""Обработка аудио: декодирование, неагрессивный VAD (Silero, встроенный в
faster-whisper), сборка обрезанного файла и карта сегментов orig<->trim.

Зависимости: faster-whisper (тянет PyAV + onnxruntime + бандл Silero VAD),
numpy. Системный ffmpeg и soundfile НЕ требуются — декодирование идёт через
PyAV (faster_whisper.audio.decode_audio), запись WAV — через стандартный wave.
"""

import os
import wave
import numpy as np

from faster_whisper.audio import decode_audio
from faster_whisper.vad import VadOptions, get_speech_timestamps

SAMPLE_RATE = 16000

# --- Неагрессивные настройки VAD ---------------------------------------------
# Цель: НЕ терять слова. Поэтому:
#   threshold ниже дефолта (0.5 -> 0.30) — ловим тихую речь;
#   speech_pad_ms щедрый — не обрезаем начала/концы слов;
#   min_silence_duration_ms большой — вырезаем только ЯВНО длинные паузы;
#   min_speech_duration_ms маленький — не выкидываем короткие реплики.
NONAGGRESSIVE_VAD = VadOptions(
    threshold=0.25,
    neg_threshold=0.15,
    min_speech_duration_ms=0,
    min_silence_duration_ms=1500,
    speech_pad_ms=500,
)


def load_audio(path: str, sampling_rate: int = SAMPLE_RATE) -> np.ndarray:
    """Декодирует любой формат в моно float32 [-1, 1] на нужной частоте."""
    return decode_audio(path, sampling_rate=sampling_rate)


def detect_speech_segments(audio: np.ndarray,
                           sampling_rate: int = SAMPLE_RATE,
                           vad_options: VadOptions = NONAGGRESSIVE_VAD):
    """Возвращает речевые сегменты в координатах ОРИГИНАЛА:
    [{'start_sample','end_sample','orig_start','orig_end'}], в секундах + сэмплах.
    """
    raw = get_speech_timestamps(audio, vad_options, sampling_rate=sampling_rate)
    segments = []
    for s in raw:
        start_s, end_s = int(s["start"]), int(s["end"])
        segments.append({
            "start_sample": start_s,
            "end_sample": end_s,
            "orig_start": round(start_s / sampling_rate, 3),
            "orig_end": round(end_s / sampling_rate, 3),
        })
    return segments


def build_segment_map(segments):
    """Добавляет trim_start/trim_end (склейка речевых кусков встык)."""
    cum = 0.0
    for s in segments:
        dur = (s["end_sample"] - s["start_sample"]) / SAMPLE_RATE
        s["trim_start"] = round(cum, 3)
        s["trim_end"] = round(cum + dur, 3)
        cum += dur
    return segments


def concat_speech(audio: np.ndarray, segments) -> np.ndarray:
    """Склеивает только речевые куски (для обрезанного файла / плеера)."""
    if not segments:
        return np.zeros(0, dtype=np.float32)
    chunks = [audio[s["start_sample"]:s["end_sample"]] for s in segments]
    return np.concatenate(chunks).astype(np.float32)


def write_wav(path: str, audio: np.ndarray, sampling_rate: int = SAMPLE_RATE) -> None:
    """Пишет моно WAV 16-bit PCM без внешних зависимостей."""
    audio = np.clip(audio, -1.0, 1.0)
    pcm16 = (audio * 32767.0).astype("<i2")
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sampling_rate)
        wf.writeframes(pcm16.tobytes())


def process_silence(input_path: str, work_dir: str):
    """Полный препроцессинг одного файла.

    Возвращает dict:
      original_wav  — нормализованный оригинал 16к моно (источник для транскрипции),
      processed_wav — обрезанный файл (для плеера),
      segments      — карта VAD orig<->trim,
      stats         — длительности и доля тишины.
    """
    os.makedirs(work_dir, exist_ok=True)
    audio = load_audio(input_path)

    # нормализованный оригинал в storage (мы транскрибируем именно его)
    original_wav = os.path.join(work_dir, "original_16k.wav")
    write_wav(original_wav, audio)

    segments = detect_speech_segments(audio)
    segments = build_segment_map(segments)

    speech = concat_speech(audio, segments)
    processed_wav = os.path.join(work_dir, "processed.wav")
    write_wav(processed_wav, speech)

    total_sec = round(len(audio) / SAMPLE_RATE, 3)
    speech_sec = round(len(speech) / SAMPLE_RATE, 3)
    stats = {
        "total_sec": total_sec,
        "speech_sec": speech_sec,
        "silence_removed_sec": round(total_sec - speech_sec, 3),
        "trim_ratio": round(speech_sec / total_sec, 4) if total_sec else 0.0,
        "n_segments": len(segments),
    }
    return {
        "original_wav": original_wav,
        "processed_wav": processed_wav,
        "segments": segments,
        "stats": stats,
        "audio": audio,                 # декодированный массив (для маршрутизации сегментов)
    }
