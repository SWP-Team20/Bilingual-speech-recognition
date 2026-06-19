# -*- coding: utf-8 -*-
"""ASR на faster-whisper. Транскрибируем ОРИГИНАЛ (нормализованный 16к моно).

Возвращаем слова с таймкодами (в координатах оригинала) и уверенностью.
Модель грузится один раз (синглтон). Размер модели и устройство — через env:
  WHISPER_MODEL (по умолчанию 'small'), WHISPER_DEVICE ('cpu'/'cuda').
"""

import os
from faster_whisper import WhisperModel

_model = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        name = os.environ.get("WHISPER_MODEL", "small")
        device = os.environ.get("WHISPER_DEVICE", "cpu")
        compute = os.environ.get("WHISPER_COMPUTE", "int8" if device == "cpu" else "float16")
        _model = WhisperModel(name, device=device, compute_type=compute)
    return _model


def transcribe(path: str, language: str = "ru", vad_filter: bool = True):
    """Транскрибирует файл -> список слов:
    [{'text','start','end','conf'}], таймкоды в координатах этого файла.

    vad_filter=True защищает от галлюцинаций Whisper в длинных паузах
    (важно при транскрипции ОРИГИНАЛА, где паузы остались).
    """
    model = get_model()
    segments, info = model.transcribe(
        path,
        language=language,
        word_timestamps=True,
        vad_filter=vad_filter,
        beam_size=5,
    )
    words = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            words.append({
                "text": w.word.strip(),
                "start": round(w.start, 3),
                "end": round(w.end, 3),
                "conf": round(w.probability, 3),
            })
    return words
