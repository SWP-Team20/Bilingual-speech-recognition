# -*- coding: utf-8 -*-
"""Тесты языкового фильтра статистики."""
import pytest

pytestmark = pytest.mark.unit


def test_unknown_language_clause_imports():
    from backend.src.services.audio_filter import _unknown_language_clause, _apply_stats_language_filter

    assert callable(_unknown_language_clause)
    assert callable(_apply_stats_language_filter)
