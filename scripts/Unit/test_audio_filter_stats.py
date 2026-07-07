# -*- coding: utf-8 -*-
"""Юнит-тесты фильтров корпуса для статистики."""
import pytest

from backend.src.services.audio_filter import CorpusFilters, StatsFilters, resolved_speakers

pytestmark = pytest.mark.unit


def test_resolved_speakers_merges_repeated_and_legacy_values():
    filters = CorpusFilters(speakers=["мама", "папа"], speaker="бабушка,мама")
    assert resolved_speakers(filters) == ["мама", "папа", "бабушка"]


def test_resolved_speakers_empty():
    assert resolved_speakers(CorpusFilters()) == []


def test_stats_filters_only_speaker_date_lang():
    filters = StatsFilters(langs=["ru"], speakers=["мама"], date_from="2025-01-01")
    assert filters.langs == ["ru"]
    assert filters.speakers == ["мама"]
    assert filters.date_from == "2025-01-01"
    assert not hasattr(filters, "words")
