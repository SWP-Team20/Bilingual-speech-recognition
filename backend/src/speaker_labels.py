# -*- coding: utf-8 -*-
"""Локальные метки говорящих в transcription.json и fallback при сбое диаризации."""

import re

DEFAULT_LOCAL_SPEAKER = "Говорящий 1"
_AUTO_SPEAKER_LABEL_RE = re.compile(r"^Говорящий (\d+)$")


def is_auto_diarization_label(label: str) -> bool:
    """True для автоматических меток диаризации («Говорящий 1», «Говорящий 2», …)."""
    return bool(_AUTO_SPEAKER_LABEL_RE.fullmatch((label or "").strip()))


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
