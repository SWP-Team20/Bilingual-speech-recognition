# -*- coding: utf-8 -*-
from unittest.mock import MagicMock

import pytest

from backend.src.services.audio_filter import CorpusFilters, apply_audio_corpus_filters


def test_apply_word_corpus_filters_skips_blank_speaker():
    query = MagicMock()
    query.filter.return_value = query
    query.join.return_value = query

    result = apply_audio_corpus_filters(query, CorpusFilters(speaker="   "))

    query.join.assert_not_called()
    assert result is query


def test_apply_word_corpus_filters_joins_speaker_for_partial_match():
    query = MagicMock()
    query.filter.return_value = query
    query.join.return_value = query

    apply_audio_corpus_filters(query, CorpusFilters(speaker="мама"))

    query.join.assert_called_once()
    query.filter.assert_called_once()
