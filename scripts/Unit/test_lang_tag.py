# -*- coding: utf-8 -*-
"""Unit tests for backend.src.lang_tag (ru/tt word-level tagging)."""
import pytest

from backend.src.lang_tag import has_tatar_letters, tag_language, tag_language_seg

pytestmark = pytest.mark.unit


def test_has_tatar_letters_detects_tatar_alphabet():
    assert has_tatar_letters("бәлки") is True
    assert has_tatar_letters("дом") is False


def test_tag_language_tatar_special_letters():
    word, lang = tag_language("бәлки")
    assert lang == "tt"
    assert word == "бәлки"


def test_tag_language_tatar_wordlist_entry():
    word, lang = tag_language("сәлам")
    assert lang == "tt"
    assert word == "сәлам"


def test_tag_language_russian_cyrillic():
    word, lang = tag_language("привет")
    assert lang == "ru"
    assert word == "привет"


def test_tag_language_unknown_latin():
    word, lang = tag_language("hello")
    assert lang == "unknown"
    assert word == "hello"


def test_tag_language_empty_word():
    word, lang = tag_language("!!!")
    assert lang == "unknown"


def test_tag_language_seg_uses_segment_language_for_ambiguous_word():
    word, lang = tag_language_seg("слово", "tt")
    assert lang == "tt"
    assert word == "слово"


def test_tag_language_seg_lexicon_overrides_segment():
    word, lang = tag_language_seg("сәлам", "ru")
    assert lang == "tt"
    assert word == "сәлам"


def test_tag_language_seg_defaults_to_ru_when_segment_unknown():
    word, lang = tag_language_seg("дом", "unknown")
    assert lang == "ru"
    assert word == "дом"
