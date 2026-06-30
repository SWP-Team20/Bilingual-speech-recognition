# -*- coding: utf-8 -*-
"""Фильтры корпуса: дата · слово · говорящий · язык (см. docs/storage_and_search.md)."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Query

from backend.src import models


@dataclass
class CorpusFilters:
    word: Optional[str] = None
    lang: Optional[str] = None
    speaker: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    status: Optional[str] = None


def normalize_word(word: str) -> str:
    return word.strip().lower()


def parse_date_from(value: str) -> datetime:
    return datetime.fromisoformat(value.strip())


def parse_date_to_exclusive(value: str) -> datetime:
    """Inclusive end date (YYYY-MM-DD) -> exclusive upper bound."""
    parsed = datetime.fromisoformat(value.strip())
    if "T" not in value.strip():
        return parsed + timedelta(days=1)
    return parsed


def apply_date_filters(query: Query, filters: CorpusFilters) -> Query:
    if filters.date_from:
        query = query.filter(models.AudioFile.recorded_at >= parse_date_from(filters.date_from))
    if filters.date_to:
        query = query.filter(models.AudioFile.recorded_at < parse_date_to_exclusive(filters.date_to))
    return query


def apply_word_corpus_filters(query: Query, filters: CorpusFilters) -> Query:
    if filters.word:
        query = query.filter(models.Word.text == normalize_word(filters.word))
    if filters.lang:
        query = query.filter(models.Word.language == filters.lang)
    if filters.speaker:
        query = query.join(models.Speaker, models.Speaker.id == models.Word.speaker_id)
        query = query.filter(models.Speaker.label == filters.speaker)
    return query


def filter_audio_files(query: Query, filters: CorpusFilters) -> Query:
    query = apply_date_filters(query, filters)
    if filters.status:
        query = query.filter(models.AudioFile.status == filters.status)
    if filters.word or filters.lang or filters.speaker:
        query = query.join(models.Word, models.Word.audio_id == models.AudioFile.id)
        query = apply_word_corpus_filters(query, filters)
        query = query.distinct()
    return query.order_by(
        models.AudioFile.recorded_at.desc().nullslast(),
        models.AudioFile.uploaded_at.desc(),
    )


def filter_word_hits(query: Query, filters: CorpusFilters) -> Query:
    query = apply_date_filters(query, filters)
    query = apply_word_corpus_filters(query, filters)
    return query.order_by(
        models.AudioFile.recorded_at.desc().nullslast(),
        models.Word.position,
    )
