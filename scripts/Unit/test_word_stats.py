# -*- coding: utf-8 -*-
"""Юнит-тесты сервиса корпусной статистики слов."""
import pytest

from backend.src.services.word_stats import (
    WordFrequency,
    FrequentWordsResult,
    SpeakerWordCount,
    SpeakerWordsResult,
    LanguageWordCount,
    LanguageWordsResult,
    DateWordCount,
    DateWordsResult,
)

pytestmark = pytest.mark.unit


def test_frequent_words_result_dataclass():
    items = [
        WordFrequency(text="дом", language="ru", count=12),
        WordFrequency(text="матур", language="tt", count=8),
    ]
    result = FrequentWordsResult(items=items, total_words=20, unique_words=2, limit=50)
    assert len(result.items) == 2
    assert result.total_words == 20
    assert result.items[0].count == 12


def test_speaker_words_result_dataclass():
    items = [
        SpeakerWordCount(speaker_id=1, label="мама", count=120),
        SpeakerWordCount(speaker_id=2, label="папа", count=80),
    ]
    result = SpeakerWordsResult(items=items, total_words=200, total_speakers=2, limit=20)
    assert len(result.items) == 2
    assert result.total_words == 200
    assert result.items[0].label == "мама"


def test_language_words_result_dataclass():
    items = [
        LanguageWordCount(language="ru", label="Русский", count=150),
        LanguageWordCount(language="tt", label="Татарский", count=90),
        LanguageWordCount(language="unknown", label="Другие", count=10),
    ]
    result = LanguageWordsResult(items=items, total_words=250)
    assert len(result.items) == 3
    assert result.total_words == 250
    assert result.items[2].count == 10


def test_date_words_result_dataclass():
    items = [
        DateWordCount(date="2024-01-15", label="2024-01-15", count=42),
        DateWordCount(date="2024-01-20", label="2024-01-20", count=18),
    ]
    result = DateWordsResult(items=items, total_words=60, total_dates=2, limit=30)
    assert len(result.items) == 2
    assert result.total_dates == 2
    assert result.items[0].count == 42
