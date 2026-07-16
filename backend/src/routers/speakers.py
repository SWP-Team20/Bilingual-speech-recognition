from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db
from backend.src.dependencies import get_current_user
from backend.src.models import User, UserRole
from backend.src.services.audio_filter import parse_multi_values
from backend.src.services import speaker_words

router = APIRouter(prefix="/speakers", tags=["Speakers"])


def _require_corpus_manager(current_user: User) -> None:
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")


def _speaker_rows(db: Session):
    return (
        db.query(
            models.Speaker,
            func.count(func.distinct(models.Word.audio_id)).label("audio_count"),
        )
        .outerjoin(models.Word, models.Word.speaker_id == models.Speaker.id)
        .group_by(models.Speaker.id)
        .order_by(models.Speaker.label)
    )


def _to_speaker_response(speaker: models.Speaker, audio_count: int) -> schemas.SpeakerResponse:
    return schemas.SpeakerResponse(
        id=speaker.id,
        label=speaker.label,
        created_at=speaker.created_at,
        audio_count=audio_count,
    )


@router.get("/", response_model=List[schemas.SpeakerResponse])
async def list_speakers(
    include_orphans: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список говорящих в корпусе. По умолчанию — только те, у кого есть слова в записях."""
    rows = _speaker_rows(db).all()
    result = [_to_speaker_response(speaker, audio_count) for speaker, audio_count in rows]
    if not include_orphans:
        result = [speaker for speaker in result if speaker.audio_count > 0]
    return result


@router.get("/{speaker_id}/words", response_model=schemas.SpeakerWordHitsResponse)
async def list_speaker_words(
    speaker_id: int,
    date_from: Optional[str] = Query(None, description="Дата записи с (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по (YYYY-MM-DD)"),
    audio_id: Optional[List[str]] = Query(None, description="UUID аудиозаписей"),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Все слова говорящего с таймкодами для перехода к записи."""
    _require_corpus_manager(current_user)
    audio_ids: List[UUID] = []
    for raw in parse_multi_values(audio_id):
        try:
            audio_ids.append(UUID(raw))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Некорректный audio_id: {raw}") from exc

    result = speaker_words.compute_speaker_word_hits(
        db,
        speaker_id,
        date_from=date_from,
        date_to=date_to,
        audio_ids=audio_ids,
        limit=limit,
        offset=offset,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Говорящий не найден")

    return schemas.SpeakerWordHitsResponse(
        speaker_id=result.speaker_id,
        speaker_label=result.speaker_label,
        items=[
            schemas.SpeakerWordHitItem(
                audio_id=item.audio_id,
                audio_filename=item.audio_filename,
                recorded_at=item.recorded_at,
                text=item.text,
                raw=item.raw,
                language=item.language,
                start_sec=item.start_sec,
                end_sec=item.end_sec,
                position=item.position,
                confidence=item.confidence,
            )
            for item in result.items
        ],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )


@router.post("/reconcile-labels", status_code=status.HTTP_204_NO_CONTENT)
async def reconcile_speaker_labels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Привязать слова в БД к пользовательским меткам из transcription.json."""
    _require_corpus_manager(current_user)

    from backend.src import db_index

    db_index.reconcile_corpus_speaker_labels(db)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/cleanup-orphans", status_code=status.HTTP_204_NO_CONTENT)
async def cleanup_orphan_speakers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Удалить спикеров без привязанных слов (остатки после переиндексации)."""
    _require_corpus_manager(current_user)

    from backend.src import db_index

    db_index.cleanup_orphan_speakers(db)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{speaker_id}", response_model=schemas.SpeakerResponse)
async def rename_speaker(
    speaker_id: int,
    payload: schemas.UpdateSpeakerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Переименовать говорящего (например, «Говорящий 1» → «мама»). Метка общая для всех записей."""
    _require_corpus_manager(current_user)

    speaker = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Говорящий не найден")

    new_label = payload.label.strip()
    if not new_label:
        raise HTTPException(status_code=400, detail="Метка не может быть пустой")

    duplicate = (
        db.query(models.Speaker)
        .filter(
            func.lower(models.Speaker.label) == new_label.lower(),
            models.Speaker.id != speaker_id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Говорящий с такой меткой уже существует",
        )

    speaker.label = new_label
    db.commit()
    db.refresh(speaker)

    audio_count = (
        db.query(func.count(func.distinct(models.Word.audio_id)))
        .filter(models.Word.speaker_id == speaker.id)
        .scalar()
        or 0
    )
    return _to_speaker_response(speaker, audio_count)
