# -*- coding: utf-8 -*-
"""Фильтры корпуса: дата · слово · говорящий · язык (см. docs/storage_and_search.md)."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Union
from uuid import UUID

from sqlalchemy import and_, exists, or_
from sqlalchemy.orm import Query

from backend.src import models


@dataclass
class StatsFilters:
    langs: List[str] = field(default_factory=list)
    speakers: List[str] = field(default_factory=list)
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    status: Optional[str] = None


@dataclass
class CorpusFilters:
    words: List[str] = field(default_factory=list)
    langs: List[str] = field(default_factory=list)
    speakers: List[str] = field(default_factory=list)
    speaker: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    status: Optional[str] = None
    audio_ids: List[UUID] = field(default_factory=list)


def parse_multi_values(values: Optional[Union[str, List[str]]]) -> List[str]:
    """Parse repeated query params and/or comma-separated values."""
    if not values:
        return []
    items = values if isinstance(values, list) else [values]
    result: List[str] = []
    for item in items:
        for part in str(item).split(","):
            cleaned = part.strip()
            if cleaned:
                result.append(cleaned)
    return result


def normalize_word(word: str) -> str:
    """Нормализует слово так же, как при сохранении в БД (lang_tag._clean):
    нижний регистр + только буквы. Это нужно, чтобы поисковый запрос
    совпадал с уже очищенным от пунктуации Word.text."""
    return "".join(ch for ch in word.lower() if ch.isalpha())


def normalized_words(words: List[str]) -> List[str]:
    seen = set()
    result: List[str] = []
    for word in words:
        normalized = normalize_word(word)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def parse_date_from(value: str) -> datetime:
    return datetime.fromisoformat(value.strip())


def parse_date_to_exclusive(value: str) -> datetime:
    """Inclusive end date (YYYY-MM-DD) -> exclusive upper bound."""
    parsed = datetime.fromisoformat(value.strip())
    if "T" not in value.strip():
        return parsed + timedelta(days=1)
    return parsed


def apply_date_filters(query: Query, filters: CorpusFilters | StatsFilters) -> Query:
    if filters.date_from:
        query = query.filter(models.AudioFile.recorded_at >= parse_date_from(filters.date_from))
    if filters.date_to:
        query = query.filter(models.AudioFile.recorded_at < parse_date_to_exclusive(filters.date_to))
    return query


def apply_audio_id_filters(query: Query, filters: CorpusFilters) -> Query:
    if filters.audio_ids:
        query = query.filter(models.AudioFile.id.in_(filters.audio_ids))
    return query


def resolved_speakers(filters: CorpusFilters) -> List[str]:
    """Merge legacy single speaker with repeated/comma-separated speaker params."""
    speakers = list(filters.speakers)
    if filters.speaker:
        speakers.extend(parse_multi_values(filters.speaker))
    seen = set()
    result: List[str] = []
    for label in speakers:
        cleaned = label.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def _audio_has_word(audio_id_column, normalized_word: str):
    return exists().where(
        and_(
            models.Word.audio_id == audio_id_column,
            models.Word.text == normalized_word,
        )
    )


def _audio_has_language(audio_id_column, language: str):
    return exists().where(
        and_(
            models.Word.audio_id == audio_id_column,
            models.Word.language == language,
        )
    )


def _audio_has_speaker(audio_id_column, speaker: str):
    return exists().where(
        and_(
            models.Word.audio_id == audio_id_column,
            models.Word.speaker_id == models.Speaker.id,
            models.Speaker.label == speaker,
        )
    )


def apply_audio_corpus_filters(query: Query, filters: CorpusFilters) -> Query:
    """Each word/lang/speaker constraint applies at the audio level (AND)."""
    for word in normalized_words(filters.words):
        query = query.filter(_audio_has_word(models.AudioFile.id, word))

    for language in filters.langs:
        query = query.filter(_audio_has_language(models.AudioFile.id, language))

    speakers = resolved_speakers(filters)
    if speakers:
        query = query.join(models.Speaker, models.Speaker.id == models.Word.speaker_id)
        if len(speakers) == 1:
            query = query.filter(models.Speaker.label.ilike(f"%{speakers[0]}%"))
        else:
            query = query.filter(models.Speaker.label.in_(speakers))
    return query


def filter_audio_files(query: Query, filters: CorpusFilters) -> Query:
    query = apply_date_filters(query, filters)
    query = apply_audio_id_filters(query, filters)
    if filters.status:
        query = query.filter(models.AudioFile.status == filters.status)
    if filters.words or filters.langs or resolved_speakers(filters):
        query = apply_audio_corpus_filters(query, filters)
    return query.order_by(
        models.AudioFile.recorded_at.desc().nullslast(),
        models.AudioFile.uploaded_at.desc(),
    )


def filter_word_hits(query: Query, filters: CorpusFilters) -> Query:
    query = apply_date_filters(query, filters)
    query = apply_audio_id_filters(query, filters)
    query = apply_audio_corpus_filters(query, filters)

    words = normalized_words(filters.words)
    if words:
        query = query.filter(models.Word.text.in_(words))
    elif filters.langs:
        query = query.filter(models.Word.language.in_(filters.langs))

    speakers = resolved_speakers(filters)
    if speakers:
        query = query.join(models.Speaker, models.Speaker.id == models.Word.speaker_id)
        query = query.filter(models.Speaker.label.in_(speakers))

    return query.order_by(
        models.AudioFile.recorded_at.desc().nullslast(),
        models.Word.position,
    )


def _unknown_language_clause():
    """Слова без уверенной классификации ru/tt."""
    return or_(
        models.Word.language == "unknown",
        models.Word.language.is_(None),
        models.Word.language == "",
        models.Word.language.notin_(["ru", "tt"]),
    )


def _apply_stats_language_filter(query: Query, langs: List[str]) -> Query:
    requested = [lang for lang in langs if lang in ("ru", "tt", "unknown")]
    if not langs:
        return query
    if not requested:
        return query.filter(False)

    clauses = []
    if "ru" in requested:
        clauses.append(models.Word.language == "ru")
    if "tt" in requested:
        clauses.append(models.Word.language == "tt")
    if "unknown" in requested:
        clauses.append(_unknown_language_clause())

    return query.filter(or_(*clauses))


def apply_stats_filters(query: Query, filters: StatsFilters) -> Query:
    """Restrict a Word query for statistics: speaker, date, language only."""
    query = query.join(models.AudioFile, models.AudioFile.id == models.Word.audio_id)
    query = apply_date_filters(query, filters)

    if filters.status:
        query = query.filter(models.AudioFile.status == filters.status)

    if filters.langs:
        query = _apply_stats_language_filter(query, filters.langs)

    speakers = [label.strip() for label in filters.speakers if label.strip()]
    if speakers:
        query = query.join(models.Speaker, models.Speaker.id == models.Word.speaker_id)
        if len(speakers) == 1:
            query = query.filter(models.Speaker.label.ilike(f"%{speakers[0]}%"))
        else:
            query = query.filter(models.Speaker.label.in_(speakers))

    return query
