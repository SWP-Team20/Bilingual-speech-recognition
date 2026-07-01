# -*- coding: utf-8 -*-
from datetime import datetime

import pytest

from backend.src.services.audio_filter import (
    CorpusFilters,
    normalize_word,
    normalized_words,
    parse_date_from,
    parse_date_to_exclusive,
    parse_multi_values,
)


def test_normalize_word():
    assert normalize_word("  СТАНЦИЯ, ") == "станция"


def test_normalized_words_deduplicates():
    assert normalized_words(["Для", " для,", "для"]) == ["для"]


def test_parse_multi_values_single_string():
    assert parse_multi_values("для") == ["для"]


def test_parse_multi_values_comma_separated():
    assert parse_multi_values("для, җиңү") == ["для", "җиңү"]


def test_parse_multi_values_repeated_params():
    assert parse_multi_values(["для", "җиңү"]) == ["для", "җиңү"]


def test_parse_multi_values_mixed():
    assert parse_multi_values(["для,җиңү", "братан"]) == ["для", "җиңү", "братан"]


def test_parse_date_from_date_only():
    assert parse_date_from("2026-06-20") == datetime(2026, 6, 20)


def test_parse_date_to_exclusive_date_only():
    assert parse_date_to_exclusive("2026-06-20") == datetime(2026, 6, 21)


def test_parse_date_to_exclusive_datetime():
    dt = datetime(2026, 6, 20, 18, 30)
    assert parse_date_to_exclusive(dt.isoformat()) == dt


def test_corpus_filters_defaults():
    filters = CorpusFilters()
    assert filters.words == []
    assert filters.langs == []
    assert filters.speaker is None
