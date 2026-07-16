# -*- coding: utf-8 -*-
"""Слова конкретного говорящего с таймкодами для вкладки «Спикеры»."""

from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src import models
from backend.src.services import audio_soft_delete
from backend.src.services.audio_filter import StatsFilters, apply_date_filters, _apply_stats_language_filter


@dataclass
class SpeakerWordHit:
    audio_id: UUID
    audio_filename: str
    recorded_at: object
    text: str
    raw: Optional[str]
    language: str
    start_sec: float
    end_sec: float
    position: int
    confidence: Optional[float]


@dataclass
class SpeakerWordHitsResult:
    speaker_id: int
    speaker_label: str
    items: List[SpeakerWordHit]
    total: int
    limit: int
    offset: int


def _base_query(db: Session, speaker_id: int, filters: StatsFilters):
    query = (
        db.query(models.Word, models.AudioFile)
        .join(models.AudioFile, models.AudioFile.id == models.Word.audio_id)
        .filter(models.Word.speaker_id == speaker_id)
    )
    query = audio_soft_delete.active_audio_filter(query)
    query = apply_date_filters(query, filters)
    if filters.audio_ids:
        query = query.filter(models.AudioFile.id.in_(filters.audio_ids))
    if filters.status:
        query = query.filter(models.AudioFile.status == filters.status)
    if filters.langs:
        query = _apply_stats_language_filter(query, filters.langs)
    return query


def compute_speaker_word_hits(
    db: Session,
    speaker_id: int,
    *,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    audio_ids: Optional[List[UUID]] = None,
    langs: Optional[List[str]] = None,
    status: Optional[str] = "done",
    limit: int = 500,
    offset: int = 0,
) -> Optional[SpeakerWordHitsResult]:
    speaker = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
    if speaker is None:
        return None

    limit = max(1, min(int(limit), 2000))
    offset = max(0, int(offset))
    filters = StatsFilters(
        date_from=date_from,
        date_to=date_to,
        audio_ids=audio_ids or [],
        langs=langs or [],
        status=status,
    )

    query = _base_query(db, speaker_id, filters)
    total = query.with_entities(func.count(models.Word.id)).scalar() or 0

    rows = (
        query.order_by(
            models.AudioFile.recorded_at.desc().nullslast(),
            models.AudioFile.uploaded_at.desc(),
            models.Word.position,
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        SpeakerWordHit(
            audio_id=word.audio_id,
            audio_filename=audio.filename,
            recorded_at=audio.recorded_at,
            text=word.text,
            raw=word.raw,
            language=word.language,
            start_sec=word.start_sec,
            end_sec=word.end_sec,
            position=word.position,
            confidence=word.confidence,
        )
        for word, audio in rows
    ]

    return SpeakerWordHitsResult(
        speaker_id=speaker.id,
        speaker_label=speaker.label,
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )
