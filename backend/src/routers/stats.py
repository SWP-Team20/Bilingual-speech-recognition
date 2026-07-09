from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.orm import Session
from uuid import UUID

from backend.src import schemas
from backend.src.database import get_db
from backend.src.dependencies import get_current_user
from backend.src.models import User, UserRole
from backend.src.services.audio_filter import StatsFilters, parse_multi_values
from backend.src.services import word_stats

router = APIRouter(prefix="/stats", tags=["Statistics"])


def _parse_audio_ids(audio_id: Optional[list[str]]) -> List[UUID]:
    audio_ids: List[UUID] = []
    for raw_id in parse_multi_values(audio_id):
        try:
            audio_ids.append(UUID(raw_id))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Некорректный audio_id: {raw_id}") from exc
    return audio_ids


@router.get("/words/frequent", response_model=schemas.FrequentWordsResponse)
async def get_frequent_words(
    lang: Optional[list[str]] = Query(None, description="Язык: ru / tt / unknown"),
    speaker: Optional[list[str]] = Query(None, description="Говорящий (мама / папа / …)"),
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=500, description="Максимальное число слов в ответе"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Самые частые слова. Фильтры: говорящий, язык (ru/tt/unknown), дата."""
    filters = StatsFilters(
        langs=parse_multi_values(lang),
        speakers=parse_multi_values(speaker),
        date_from=date_from,
        date_to=date_to,
        status="done",
    )
    result = word_stats.compute_frequent_words(db, filters, limit=limit)
    return schemas.FrequentWordsResponse(
        items=[
            schemas.WordFrequencyItem(text=item.text, language=item.language, count=item.count)
            for item in result.items
        ],
        total_words=result.total_words,
        unique_words=result.unique_words,
        limit=result.limit,
    )


@router.get("/languages/words", response_model=schemas.LanguageWordsResponse)
async def get_language_word_stats(
    speaker: Optional[list[str]] = Query(None, description="Говорящий (мама / папа / …)"),
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    audio_id: Optional[list[str]] = Query(None, description="UUID аудиозаписей; можно повторять или через запятую"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Количество слов по языкам. Фильтры: говорящий, дата, аудиозаписи."""
    filters = StatsFilters(
        speakers=parse_multi_values(speaker),
        date_from=date_from,
        date_to=date_to,
        audio_ids=_parse_audio_ids(audio_id),
        status="done",
    )
    result = word_stats.compute_language_word_counts(db, filters)
    return schemas.LanguageWordsResponse(
        items=[
            schemas.LanguageWordCountItem(
                language=item.language,
                label=item.label,
                count=item.count,
            )
            for item in result.items
        ],
        total_words=result.total_words,
    )


@router.get("/dates/words", response_model=schemas.DateWordsResponse)
async def get_date_word_stats(
    lang: Optional[list[str]] = Query(None, description="Язык: ru / tt / unknown"),
    speaker: Optional[list[str]] = Query(None, description="Говорящий (мама / папа / …)"),
    audio_id: Optional[list[str]] = Query(None, description="UUID аудиозаписей; можно повторять или через запятую"),
    limit: int = Query(30, ge=1, le=500, description="Максимальное число дат на графике"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Количество слов по датам записи. Фильтры: язык, говорящий, аудиозаписи."""
    filters = StatsFilters(
        langs=parse_multi_values(lang),
        speakers=parse_multi_values(speaker),
        audio_ids=_parse_audio_ids(audio_id),
        status="done",
    )
    result = word_stats.compute_date_word_counts(db, filters, limit=limit)
    return schemas.DateWordsResponse(
        items=[
            schemas.DateWordCountItem(
                date=item.date,
                label=item.label,
                count=item.count,
            )
            for item in result.items
        ],
        total_words=result.total_words,
        total_dates=result.total_dates,
        limit=result.limit,
    )


@router.get("/speakers/words", response_model=schemas.SpeakerWordsResponse)
async def get_speaker_word_stats(
    lang: Optional[list[str]] = Query(None, description="Язык: ru / tt / unknown"),
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    audio_id: Optional[list[str]] = Query(None, description="UUID аудиозаписей; можно повторять или через запятую"),
    limit: int = Query(20, ge=1, le=500, description="Максимальное число говорящих в ответе"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Количество слов по говорящим. Фильтры: язык, дата, аудиозаписи."""
    filters = StatsFilters(
        langs=parse_multi_values(lang),
        date_from=date_from,
        date_to=date_to,
        audio_ids=_parse_audio_ids(audio_id),
        status="done",
    )
    result = word_stats.compute_speaker_word_counts(db, filters, limit=limit)
    return schemas.SpeakerWordsResponse(
        items=[
            schemas.SpeakerWordCountItem(
                speaker_id=item.speaker_id,
                label=item.label,
                count=item.count,
            )
            for item in result.items
        ],
        total_words=result.total_words,
        total_speakers=result.total_speakers,
        limit=result.limit,
    )


@router.post("/rebuild", response_model=schemas.StatsRebuildResponse)
async def rebuild_stats(
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    from_json: bool = Query(
        False,
        description="Переиндексировать слова из transcription.json перед пересчётом метрик",
    ),
    recording_status: Optional[str] = Query(
        "done",
        description="Обрабатывать только записи с этим статусом; пустая строка = все",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Пересобрать статистику за период (фильтр только по дате)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    filters = StatsFilters(date_from=date_from, date_to=date_to)
    effective_status = recording_status if recording_status else None
    try:
        processed = word_stats.rebuild_corpus_stats(
            db,
            filters=filters,
            from_json=from_json,
            status=effective_status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return schemas.StatsRebuildResponse(processed=processed, from_json=from_json)


@router.post("/rebuild/all", response_model=schemas.StatsRebuildResponse)
async def rebuild_all_stats(
    from_json: bool = Query(
        False,
        description="Переиндексировать слова из transcription.json перед пересчётом метрик",
    ),
    recording_status: Optional[str] = Query(
        "done",
        description="Статус записей для пересборки; пустая строка = все статусы",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Пересобрать статистику по всему корпусу сразу."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    effective_status = recording_status if recording_status else None
    try:
        processed = word_stats.rebuild_corpus_stats(
            db,
            filters=StatsFilters(),
            from_json=from_json,
            status=effective_status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return schemas.StatsRebuildResponse(processed=processed, from_json=from_json)


@router.post("/rebuild/{audio_id}", response_model=schemas.StatsRebuildResponse)
async def rebuild_stats_for_audio(
    audio_id: str,
    from_json: bool = Query(
        False,
        description="Переиндексировать слова из transcription.json перед пересчётом метрик",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Пересобрать статистику одной аудиозаписи."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    try:
        parsed_id = UUID(audio_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Некорректный формат ID") from exc

    try:
        word_stats.rebuild_audio_stats(db, parsed_id, from_json=from_json)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return schemas.StatsRebuildResponse(processed=1, from_json=from_json)
