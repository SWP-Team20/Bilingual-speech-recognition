# -*- coding: utf-8 -*-
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from backend.src.services.audio_filter import (
    CorpusFilters,
    filter_audio_files,
    filter_word_hits,
    normalize_word,
    normalized_words,
    parse_date_from,
    parse_date_to_exclusive,
    parse_multi_values,
)

pytestmark = pytest.mark.unit


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
    assert filters.status is None


def test_filter_audio_files_applies_status_filter():
    query = MagicMock()
    query.filter.return_value = query
    query.order_by.return_value = query

    filter_audio_files(query, CorpusFilters(status="done"))

    query.filter.assert_called()
    query.order_by.assert_called_once()


def test_filter_word_hits_applies_language_filter_when_no_words():
    query = MagicMock()
    query.filter.return_value = query
    query.join.return_value = query
    query.order_by.return_value = query

    filter_word_hits(query, CorpusFilters(langs=["tt"]))

    assert query.filter.call_count >= 1
    query.order_by.assert_called_once()
