# -*- coding: utf-8 -*-
from datetime import datetime

import pytest

from backend.src.services.audio_filter import (
    CorpusFilters,
    normalize_word,
    parse_date_from,
    parse_date_to_exclusive,
)


def test_normalize_word():
    assert normalize_word("  СТАНЦИЯ, ") == "станция"


def test_parse_date_from_date_only():
    assert parse_date_from("2026-06-20") == datetime(2026, 6, 20)


def test_parse_date_to_exclusive_date_only():
    assert parse_date_to_exclusive("2026-06-20") == datetime(2026, 6, 21)


def test_parse_date_to_exclusive_datetime():
    dt = datetime(2026, 6, 20, 18, 30)
    assert parse_date_to_exclusive(dt.isoformat()) == dt


def test_corpus_filters_defaults():
    filters = CorpusFilters()
    assert filters.word is None
    assert filters.lang is None
    assert filters.speaker is None
