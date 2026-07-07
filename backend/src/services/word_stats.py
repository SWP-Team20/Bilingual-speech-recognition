# -*- coding: utf-8 -*-
"""Корпусная статистика частот слов и пересборка производных метрик."""

from collections import Counter
from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src import db_index, models
from backend.src.services.audio_filter import StatsFilters, apply_stats_filters


@dataclass
class WordFrequency:
    text: str
    language: str
    count: int


@dataclass
class FrequentWordsResult:
    items: List[WordFrequency]
    total_words: int
    unique_words: int
    limit: int


@dataclass
class SpeakerWordCount:
    speaker_id: Optional[int]
    label: str
    count: int


@dataclass
class SpeakerWordsResult:
    items: List[SpeakerWordCount]
    total_words: int
    total_speakers: int
    limit: int


def compute_frequent_words(db: Session, filters: StatsFilters, limit: int = 50) -> FrequentWordsResult:
    """Top-N most frequent normalized words for the filtered corpus."""
    limit = max(1, min(limit, 500))

    base_query = apply_stats_filters(db.query(models.Word), filters)

    total_words = base_query.with_entities(func.count(models.Word.id)).scalar() or 0
    unique_words = (
        base_query.with_entities(func.count(func.distinct(models.Word.text))).scalar() or 0
    )

    rows = (
        base_query.with_entities(
            models.Word.text,
            models.Word.language,
            func.count(models.Word.id).label("count"),
        )
        .group_by(models.Word.text, models.Word.language)
        .order_by(func.count(models.Word.id).desc(), models.Word.text)
        .limit(limit)
        .all()
    )

    items = [WordFrequency(text=text, language=language, count=count) for text, language, count in rows]
    return FrequentWordsResult(
        items=items,
        total_words=total_words,
        unique_words=unique_words,
        limit=limit,
    )


def compute_speaker_word_counts(db: Session, filters: StatsFilters, limit: int = 20) -> SpeakerWordsResult:
    """Word counts grouped by speaker for the filtered corpus."""
    limit = max(1, min(limit, 500))

    base_query = apply_stats_filters(db.query(models.Word), filters)

    total_words = base_query.with_entities(func.count(models.Word.id)).scalar() or 0
    total_speakers = (
        base_query.with_entities(func.count(func.distinct(models.Word.speaker_id))).scalar() or 0
    )

    label_expr = func.coalesce(models.Speaker.label, "Без говорящего").label("label")

    rows = (
        base_query.outerjoin(models.Speaker, models.Speaker.id == models.Word.speaker_id)
        .with_entities(
            models.Word.speaker_id,
            label_expr,
            func.count(models.Word.id).label("count"),
        )
        .group_by(models.Word.speaker_id, models.Speaker.label)
        .order_by(func.count(models.Word.id).desc(), label_expr)
        .limit(limit)
        .all()
    )

    items = [
        SpeakerWordCount(speaker_id=speaker_id, label=label, count=count)
        for speaker_id, label, count in rows
    ]
    return SpeakerWordsResult(
        items=items,
        total_words=total_words,
        total_speakers=total_speakers,
        limit=limit,
    )


def _words_from_db_rows(rows: List[models.Word]) -> List[dict]:
    return [
        {
            "text": row.text,
            "raw": row.raw,
            "lang": row.language,
            "conf": row.confidence,
        }
        for row in rows
    ]


def rebuild_audio_stats(db: Session, audio_id: UUID, from_json: bool = False) -> None:
    """Rebuild per-audio WordCount rows and AudioFile metrics.

    When from_json=True, reindex words and counts from transcription.json first.
    Otherwise, recompute derived stats from existing Word rows (fast path after edits).
    """
    if from_json:
        db_index.reindex_from_json(db, audio_id, write_back_json=False)
        return

    audio = db.get(models.AudioFile, audio_id)
    if audio is None:
        raise ValueError("audio not found")

    rows = (
        db.query(models.Word)
        .filter(models.Word.audio_id == audio_id)
        .order_by(models.Word.position)
        .all()
    )
    words = _words_from_db_rows(rows)

    db.query(models.WordCount).filter(models.WordCount.audio_id == audio_id).delete(
        synchronize_session=False
    )
    counter = Counter()
    for word in words:
        counter[(word.get("text", ""), word.get("lang", "unknown"))] += 1
    for (text, lang), cnt in counter.items():
        db.add(models.WordCount(audio_id=audio_id, text=text, language=lang, count=cnt))

    from backend.src.services.transcript_edit import compute_stats

    stats = compute_stats(words, audio.duration_sec)
    audio.total_words = stats["total_words"]
    audio.unique_words = stats["unique_words"]
    audio.words_per_minute = stats["words_per_minute"]
    audio.ru_words = stats["ru_words"]
    audio.tt_words = stats["tt_words"]
    audio.unknown_words = stats["unknown_words"]
    audio.avg_confidence = stats["avg_confidence"]
    audio.primary_language = stats["primary_language"]
    db.commit()


def rebuild_corpus_stats(
    db: Session,
    filters: Optional[StatsFilters] = None,
    from_json: bool = False,
    status: Optional[str] = "done",
) -> int:
    """Rebuild stats for many audio files. Returns number of processed recordings."""
    filters = filters or StatsFilters()
    query = db.query(models.AudioFile.id)

    effective_status = status if status is not None else filters.status
    if effective_status:
        query = query.filter(models.AudioFile.status == effective_status)

    if filters.date_from or filters.date_to:
        from backend.src.services.audio_filter import apply_date_filters

        query = apply_date_filters(query, filters)

    processed = 0
    for (audio_id,) in query.all():
        rebuild_audio_stats(db, audio_id, from_json=from_json)
        processed += 1
    return processed
