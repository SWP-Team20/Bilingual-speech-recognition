# -*- coding: utf-8 -*-
"""Unit tests for backend.src.text_filter (meaningful-word filter)."""
import pytest

from backend.src.text_filter import MIN_CONFIDENCE, is_meaningful, normalize

pytestmark = pytest.mark.unit


def test_normalize_strips_punctuation_and_lowercases():
    assert normalize("Привет!") == "привет"
    assert normalize("...") == ""


def test_is_meaningful_rejects_punctuation_only():
    assert is_meaningful("!!!", 0.99) is False


def test_is_meaningful_rejects_low_confidence():
    assert is_meaningful("слово", MIN_CONFIDENCE - 0.01) is False


def test_is_meaningful_accepts_high_confidence_word():
    assert is_meaningful("слово", 0.9) is True


def test_is_meaningful_accepts_short_allowed_russian_words():
    assert is_meaningful("я", 0.5) is True
    assert is_meaningful("и", 0.5) is True


def test_is_meaningful_rejects_single_letter_noise():
    assert is_meaningful("x", 0.9) is False


def test_is_meaningful_accepts_none_confidence():
    assert is_meaningful("дом", None) is True
