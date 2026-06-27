# -*- coding: utf-8 -*-
"""ASR русской ветки на faster-whisper (Whisper large-v3 по умолчанию).

Используется для ru-сегментов в mixed-пайплайне (татарские идут в tatar_asr).
Модель грузится один раз (синглтон). Настройка через env:
  WHISPER_MODEL  (по умолчанию 'large-v3'; для скорости можно 'small'),
  WHISPER_DEVICE ('cpu'/'cuda'), WHISPER_COMPUTE ('int8'/'float16').
"""
import os

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

from faster_whisper import WhisperModel

_model = None

# Частые галлюцинации Whisper на не-русской/тихой речи (служебные титры).
HALLUCINATION_MARKERS = [
    "субтитр", "продолжение следует", "спасибо за просмотр", "редактор",
    "корректор", "dimatorzok", "создавал", "amara.org", "озвучка",
    "подписывайтесь", "колокольчик",
]


def is_hallucination(text: str) -> bool:
    t = (text or "").lower()
    return any(m in t for m in HALLUCINATION_MARKERS)


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        name = os.environ.get("WHISPER_MODEL", "large-v3")
        device = os.environ.get("WHISPER_DEVICE", "cpu")
        compute = os.environ.get("WHISPER_COMPUTE", "int8" if device == "cpu" else "float16")
        _model = WhisperModel(name, device=device, compute_type=compute)
    return _model


def _collect(segments):
    words = []
    for seg in segments:
        if is_hallucination(seg.text or ""):
            continue                       # выкидываем галлюцинированный сегмент
        for w in (seg.words or []):
            words.append({
                "text": w.word.strip(),
                "start": round(w.start, 3),
                "end": round(w.end, 3),
                "conf": round(w.probability, 3),
            })
    return words


def transcribe(path: str, language: str = "ru", vad_filter: bool = True):
    """Транскрибирует ФАЙЛ -> список слов [{'text','start','end','conf'}]."""
    segments, _ = get_model().transcribe(
        path, language=language, word_timestamps=True,
        vad_filter=vad_filter, beam_size=5,
    )
    return _collect(segments)


def transcribe_array(chunk, language: str = "ru"):
    """Транскрибирует numpy-кусок (моно float32) -> слова с таймкодами
    в координатах куска. Для ru-сегментов mixed-пайплайна."""
    segments, _ = get_model().transcribe(
        chunk, language=language, word_timestamps=True,
        vad_filter=False, beam_size=5,
    )
    return _collect(segments)
