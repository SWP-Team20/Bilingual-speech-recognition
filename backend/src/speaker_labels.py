# -*- coding: utf-8 -*-
"""Локальные метки говорящих в transcription.json и fallback при сбое диаризации."""

DEFAULT_LOCAL_SPEAKER = "Говорящий 1"


def fill_segment_speaker_labels(seg_speakers, fallback=DEFAULT_LOCAL_SPEAKER):
    """Подставляет fallback, если диаризация не назначила метки сегментам."""
    if not seg_speakers:
        return seg_speakers
    if not any(s for s in seg_speakers if s):
        return [fallback] * len(seg_speakers)
    return [s if s else fallback for s in seg_speakers]


def ensure_word_speakers(words, fallback=DEFAULT_LOCAL_SPEAKER):
    """Назначает fallback словам без speaker. Возвращает True, если были изменения."""
    if not words:
        return False
    changed = False
    for w in words:
        if not w.get("speaker"):
            w["speaker"] = fallback
            changed = True
    return changed
