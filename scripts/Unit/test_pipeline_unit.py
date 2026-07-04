# -*- coding: utf-8 -*-
import pytest
from backend.src.pipeline import build_sentences

pytestmark = pytest.mark.unit


def test_build_sentences_empty():
    assert build_sentences([]) == []


def test_build_sentences_groups_by_speaker():
    sample_words = [
        {"text": "привет", "start": 0.0, "end": 0.5, "lang": "ru", "speaker": "Говорящий 1"},
        {"text": "салам", "start": 0.6, "end": 1.2, "lang": "tt", "speaker": "Говорящий 2"}
    ]

    sentences = build_sentences(sample_words)

    assert len(sentences) == 2
    assert sentences[0]["speaker"] == "Говорящий 1"
    assert sentences[0]["lang"] == "ru"
    assert sentences[1]["speaker"] == "Говорящий 2"
    assert sentences[1]["lang"] == "tt"


def test_build_sentences_splits_by_punctuation():
    sample_words = [
        {"text": "первое", "raw": "первое.", "start": 0.0, "end": 0.5, "lang": "ru", "speaker": "Говорящий 1"},
        {"text": "второе", "raw": "второе", "start": 0.6, "end": 1.0, "lang": "ru", "speaker": "Говорящий 1"}
    ]

    sentences = build_sentences(sample_words)

    assert len(sentences) == 2
    assert sentences[0]["text"] == "первое."
    assert sentences[1]["text"] == "второе"


def test_build_sentences_detects_mixed_language():
    sample_words = [
        {"text": "привет", "start": 0.0, "end": 0.5, "lang": "ru", "speaker": "Говорящий 1"},
        {"text": "микрофон", "start": 0.6, "end": 1.0, "lang": "tt", "speaker": "Говорящий 1"}
    ]

    sentences = build_sentences(sample_words)

    assert len(sentences) == 1
    assert sentences[0]["lang"] == "mixed"
