from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db
from backend.src.dependencies import get_current_user
from backend.src.models import User, UserRole

router = APIRouter(prefix="/speakers", tags=["Speakers"])


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


@router.post("/cleanup-orphans", status_code=status.HTTP_204_NO_CONTENT)
async def cleanup_orphan_speakers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Удалить спикеров без привязанных слов (остатки после переиндексации)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

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
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

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
