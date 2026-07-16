# -*- coding: utf-8 -*-
import pytest

from backend.src.speaker_labels import (
    DEFAULT_LOCAL_SPEAKER,
    ensure_word_speakers,
    fill_segment_speaker_labels,
)

pytestmark = pytest.mark.unit


def test_fill_segment_speaker_labels_all_none():
    assert fill_segment_speaker_labels([None, None]) == ["Говорящий 1", "Говорящий 1"]


def test_fill_segment_speaker_labels_partial():
    assert fill_segment_speaker_labels(["Говорящий 2", None]) == ["Говорящий 2", "Говорящий 1"]


def test_fill_segment_speaker_labels_empty():
    assert fill_segment_speaker_labels([]) == []


def test_fill_segment_speaker_labels_unchanged():
    labels = ["Говорящий 1", "Говорящий 2"]
    assert fill_segment_speaker_labels(labels) == labels


def test_ensure_word_speakers_assigns_fallback():
    words = [{"text": "а", "speaker": None}, {"text": "б"}]
    assert ensure_word_speakers(words) is True
    assert words[0]["speaker"] == DEFAULT_LOCAL_SPEAKER
    assert words[1]["speaker"] == DEFAULT_LOCAL_SPEAKER


def test_ensure_word_speakers_no_change():
    words = [{"text": "а", "speaker": "мама"}]
    assert ensure_word_speakers(words) is False


def test_ensure_word_speakers_empty():
    assert ensure_word_speakers([]) is False
