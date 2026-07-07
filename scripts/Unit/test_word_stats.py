# -*- coding: utf-8 -*-
"""Юнит-тесты сервиса корпусной статистики слов."""
import pytest

from backend.src.services.word_stats import WordFrequency, FrequentWordsResult

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
