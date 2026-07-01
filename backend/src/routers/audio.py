import json
import os
import glob
import shutil
import logging
from uuid import UUID, uuid4
from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Query, Response, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db, SessionLocal
from backend.src.models import User, UserRole
from backend.src.dependencies import get_current_user
import backend.src.pipeline as pipeline
from backend.src.services.audio_filter import CorpusFilters, filter_audio_files, filter_word_hits, parse_multi_values

router = APIRouter()
logger = logging.getLogger(__name__)

BASE_STORAGE_DIR = "./storage"
os.makedirs(BASE_STORAGE_DIR, exist_ok=True)


def resolve_original_path(folder_path: str, fallback_ext: str) -> str:
    """Return the path to the stored original audio file.

    The extension used when saving comes from the uploaded file, while the DB
    `filename` holds a display title that may carry a different (or no)
    extension. Guessing the extension from the title breaks downloads (e.g. a
    Russian title like "Кухня" has no extension and wrongly resolves to
    original.mp3). So we resolve the real file on disk, preferring an exact
    extension match and otherwise taking any original.* (excluding original_16k).
    """
    preferred = os.path.join(folder_path, f"original{fallback_ext}")
    matches = [
        p for p in glob.glob(os.path.join(folder_path, "original.*"))
        if not os.path.basename(p).startswith("original_16k")
    ]
    if os.path.exists(preferred):
        return preferred
    return matches[0] if matches else preferred


# --- BACKGROUND TASKS ---

def background_process_audio(input_path: str, storage_dir: str, audio_id: str, original_filename: str):
    """Выполнение пайплайна в фоне с независимой сессией БД."""
    db = SessionLocal()
    try:
        pipeline.process_audio(
            input_path=input_path,
            storage_dir=storage_dir,
            audio_id=audio_id,
            original_filename=original_filename,
            db=db,
        )
    except Exception as e:
        db.rollback()
        db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == UUID(audio_id)).first()
        if db_audio:
            db_audio.status = "error"
            db.commit()
        logger.error(f"[BACKGROUND TASK ERROR] Audio ID {audio_id}: {e}")
    finally:
        db.close()

# --- HELPER FUNCTIONS ---

def bytes_to_mb(bytes_value: int) -> float:
    return round(bytes_value / (1024 * 1024), 3)

def get_file_size_safe(path: str) -> int:
    try:
        if os.path.exists(path) and os.path.isfile(path):
            return os.path.getsize(path)
    except Exception:
        pass
    return 0

def get_folder_size(folder_path: str) -> int:
    try:
        if not folder_path or not os.path.exists(folder_path):
            return 0
        total_size = 0
        for dirpath, _, filenames in os.walk(folder_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp) and os.path.exists(fp):
                    total_size += os.path.getsize(fp)
        return total_size
    except Exception:
        return 0

# --- ALL ROLES (ADMIN, MANAGER, USER) ---

def get_corpus_filters(
    q: Optional[List[str]] = Query(None, description="Слова (точное совпадение нормализованного text); можно повторять или через запятую"),
    lang: Optional[List[str]] = Query(None, description="Языки слов в записи: ru / tt / unknown; запись должна содержать все выбранные"),
    speaker: Optional[str] = Query(None, description="Метка говорящего (мама / папа / …)"),
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Статус обработки: done / processing / error / …"),
) -> CorpusFilters:
    return CorpusFilters(
        words=parse_multi_values(q),
        langs=parse_multi_values(lang),
        speaker=speaker,
        date_from=date_from,
        date_to=date_to,
        status=status,
    )


@router.get("/audio/", response_model=List[schemas.AudioFileResponse])
async def get_all_audio(
    filters: Annotated[CorpusFilters, Depends(get_corpus_filters)],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список аудио с необязательными фильтрами: дата · слово · говорящий · язык · статус."""
    query = db.query(models.AudioFile)
    return filter_audio_files(query, filters).all()


@router.get("/audio/by-filename", response_model=List[schemas.AudioFileResponse])
async def get_audio_by_filename(
    filename: str = Query(..., min_length=1, description="Фрагмент названия аудиозаписи (поле filename в БД)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Найти аудиозаписи, в названии которых есть указанный фрагмент (без учёта регистра)."""
    name = filename.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    return (
        db.query(models.AudioFile)
        .filter(models.AudioFile.filename.ilike(f"%{name}%"))
        .order_by(models.AudioFile.uploaded_at.desc())
        .all()
    )


@router.get("/audio/{audio_id}")
async def get_audio_by_id(
        audio_id: str,
        type: str = "original",
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        parsed_uuid = UUID(audio_id.strip())
    except ValueError:
        if audio_id.startswith("temp-"):
            return Response(status_code=status.HTTP_202_ACCEPTED)

        raise HTTPException(status_code=404, detail="Запись не найдена (некорректный ID)")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == parsed_uuid).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    file_ext = os.path.splitext(audio.filename)[1] or ".mp3"

    if type == "original":
        file_path = resolve_original_path(audio.folder_path, file_ext)
        media_type = audio.content_type

    elif type == "processed":
        wav_path = os.path.join(audio.folder_path, "processed.wav")
        if os.path.exists(wav_path):
            file_path = wav_path
            media_type = "audio/wav"
        else:
            file_path = os.path.join(audio.folder_path, f"processed{file_ext}")
            media_type = audio.content_type

    else:
        raise HTTPException(
            status_code=400,
            detail="Используйте type='original', type='processed' или type='original_16k'"
        )

    if not os.path.exists(file_path):
        if audio.status in ["processing_audio", "processing"]:
            return Response(status_code=status.HTTP_202_ACCEPTED)

        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    download_name = f"{type}_{audio.filename}"
    # The display title may lack an extension (e.g. a Russian name); make sure
    # the downloaded file keeps the real extension so it opens correctly.
    if not os.path.splitext(download_name)[1]:
        actual_ext = os.path.splitext(file_path)[1]
        if actual_ext:
            download_name += actual_ext

    return FileResponse(path=file_path, media_type=media_type, filename=download_name)

@router.get("/audio/{audio_id}/sizes", response_model=schemas.AudioFileSizes)
async def get_audio_element_sizes(
        audio_id: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        parsed_uuid = UUID(audio_id.strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректный формат ID")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == parsed_uuid).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    folder = audio.folder_path
    file_ext = os.path.splitext(audio.filename)[1] or ".mp3"

    paths = {
        "original": resolve_original_path(folder, file_ext),
        "original_16k": os.path.join(folder, "original_16k.wav"),
        "processed": os.path.join(folder, "processed.wav"),
        "transcription_txt": os.path.join(folder, "transcription.txt"),
        "transcription_json": os.path.join(folder, "transcription.json"),
    }

    return {
        "original_mb": bytes_to_mb(get_file_size_safe(paths["original"])),
        "original_16k_mb": bytes_to_mb(get_file_size_safe(paths["original_16k"])),
        "processed_mb": bytes_to_mb(get_file_size_safe(paths["processed"])),
        "transcription_txt_mb": bytes_to_mb(get_file_size_safe(paths["transcription_txt"])),
        "transcription_json_mb": bytes_to_mb(get_file_size_safe(paths["transcription_json"])),
        "total_folder_mb": bytes_to_mb(get_folder_size(folder))
    }


@router.get("/audio/storage/total", response_model=schemas.TotalStorageResponse)
async def get_total_storage_allocated(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    audio_files = db.query(models.AudioFile).all()
    unique_folders = {audio.folder_path for audio in audio_files if audio.folder_path}

    total_bytes = sum(get_folder_size(folder) for folder in unique_folders)

    return {"total_allocated_mb": bytes_to_mb(total_bytes)}

# --- Update your status endpoint to handle temporary IDs gracefully ---
@router.get("/audio/{audio_id}/status", response_model=schemas.AudioStatusResponse)
async def get_audio_status(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_uuid = UUID(audio_id.strip())
    except ValueError:
        # If it's a temporary upload placeholder, tell the frontend it's actively processing
        return {"id": uuid4(), "status": "processing_audio"}

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == parsed_uuid).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    return {"id": audio.id, "status": audio.status}


@router.get("/search/", response_model=List[schemas.SearchHitResponse])
async def search_words(
    filters: Annotated[CorpusFilters, Depends(get_corpus_filters)],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Поиск по корпусу с фильтрами (все необязательны):
      q         — слово (точное совпадение нормализованного text);
      lang      — 'ru' / 'tt';
      speaker   — метка говорящего (мама/папа); работает после диаризации;
      date_from / date_to — диапазон по дате записи (recorded_at, ISO 'YYYY-MM-DD').
    Возвращает вхождения слова + таймкод оригинала (для перехода в плеере)."""
    query = (
        db.query(models.Word)
        .join(models.AudioFile, models.AudioFile.id == models.Word.audio_id)
    )
    hits = filter_word_hits(query, filters).all()
    return [
        {
            "audio_id": h.audio_id,
            "text": h.text,
            "raw": h.raw,
            "language": h.language,
            "start_sec": h.start_sec,
            "end_sec": h.end_sec,
            "confidence": h.confidence,
            "speaker": h.speaker.label if h.speaker else None,
            "recorded_at": h.audio.recorded_at if h.audio else None,
        }
        for h in hits
    ]


@router.get("/transcriptions/", response_model=List[schemas.AudioWithTextResponse])
async def get_all_transcriptions(
    filters: Annotated[CorpusFilters, Depends(get_corpus_filters)],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_files = filter_audio_files(db.query(models.AudioFile), filters).all()
    result = []
    for audio in audio_files:
        text_file_path = os.path.join(audio.folder_path, "transcription.txt")
        text_content = ""

        if os.path.exists(text_file_path):
            with open(text_file_path, "r", encoding="utf-8") as f:
                text_content = f.read()

        result.append({
            "id": audio.id,
            "filename": audio.filename,
            "transcription_text": text_content
        })
    return result


@router.get("/transcriptions/{audio_id}")
async def get_transcription_by_id(
    audio_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    transcription_json_path = os.path.join(audio.folder_path, "transcription.json")
    if not os.path.exists(transcription_json_path):
        raise HTTPException(status_code=404, detail="Файл транскрипции отсутствует")

    with open(transcription_json_path, "r", encoding="utf-8") as f:
        transcription = json.load(f)

    return {
        "id": audio.id,
        "filename": audio.filename,
        "transcription_text": " ".join(word.get("raw", word.get("text", "")) for word in transcription.get("words", [])),
        "sentences": transcription.get("sentences", []),
        "words": transcription.get("words", []),
    }


# --- RESTRICTED ROLES (ADMIN & MANAGER ONLY) ---

@router.post("/upload-audio/", response_model=schemas.AudioFileResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    recorded_at: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Файл должен быть аудиоформата")

    recorded_at_dt = None
    if recorded_at and recorded_at.strip():
        try:
            recorded_at_dt = datetime.fromisoformat(recorded_at.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="Некорректный формат даты записи (ожидается ISO YYYY-MM-DD)")
        if recorded_at_dt.date() > datetime.now().date():
            raise HTTPException(status_code=400, detail="Дата записи не может быть позже сегодняшней")

    display_name = title.strip() if title and title.strip() else file.filename

    # Названия должны быть уникальными (без учёта регистра)
    existing = (
        db.query(models.AudioFile)
        .filter(func.lower(models.AudioFile.filename) == display_name.lower())
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Аудиозапись с таким названием уже существует")

    audio_id = uuid4()
    folder_path = os.path.join(BASE_STORAGE_DIR, str(audio_id))
    os.makedirs(folder_path, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] or ".mp3"
    orig_file_path = os.path.join(folder_path, f"original{file_ext}")

    content = await file.read()
    with open(orig_file_path, "wb") as buffer:
        buffer.write(content)

    db_audio = models.AudioFile(
        id=audio_id,
        filename=display_name,
        content_type=file.content_type,
        folder_path=folder_path,
        recorded_at=recorded_at_dt,
        status="processing_audio"
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)

    background_tasks.add_task(
        background_process_audio,
        input_path=orig_file_path,
        storage_dir=BASE_STORAGE_DIR,
        audio_id=str(audio_id),
        original_filename=file.filename
    )

    return db_audio


@router.patch("/audio/{audio_id}", response_model=schemas.AudioFileResponse)
async def update_audio_metadata(
    audio_id: UUID,
    payload: schemas.UpdateAudioMetadataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Укажите название и/или дату записи")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if "title" in updates:
        new_title = updates["title"].strip()
        if not new_title:
            raise HTTPException(status_code=400, detail="Название не может быть пустым")
        existing = (
            db.query(models.AudioFile)
            .filter(
                func.lower(models.AudioFile.filename) == new_title.lower(),
                models.AudioFile.id != audio_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Аудиозапись с таким названием уже существует",
            )
        audio.filename = new_title

    if "recorded_at" in updates:
        raw_date = updates["recorded_at"]
        if raw_date is None or not str(raw_date).strip():
            audio.recorded_at = None
        else:
            try:
                recorded_at_dt = datetime.fromisoformat(str(raw_date).strip())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Некорректный формат даты записи (ожидается ISO YYYY-MM-DD)",
                )
            if recorded_at_dt.date() > datetime.now().date():
                raise HTTPException(status_code=400, detail="Дата записи не может быть позже сегодняшней")
            audio.recorded_at = recorded_at_dt

    db.commit()
    db.refresh(audio)

    json_path = os.path.join(audio.folder_path, "transcription.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, encoding="utf-8") as f:
                transcription = json.load(f)
            transcription["filename"] = audio.filename
            if audio.recorded_at is not None:
                transcription["recorded_at"] = audio.recorded_at.isoformat()
            elif "recorded_at" in updates:
                transcription.pop("recorded_at", None)
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(transcription, f, ensure_ascii=False, indent=2)
        except (OSError, json.JSONDecodeError) as e:
            logger.warning("Could not sync transcription.json for audio %s: %s", audio_id, e)

    return audio


@router.patch("/audio/{audio_id}/processed", response_model=schemas.AudioFileResponse)
async def update_processed_audio(
    audio_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    file_ext = os.path.splitext(audio.filename)[1] or ".mp3"
    proc_file_path = os.path.join(audio.folder_path, f"processed{file_ext}")

    content = await file.read()
    with open(proc_file_path, "wb") as proc_buffer:
        proc_buffer.write(content)

    db.commit()
    db.refresh(audio)
    return audio


@router.patch("/transcriptions/{audio_id}", response_model=schemas.AudioWithTextResponse)
async def update_transcription(
    audio_id: UUID,
    payload: schemas.UpdateTranscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    text_file_path = os.path.join(audio.folder_path, "transcription.txt")

    try:
        with open(text_file_path, "w", encoding="utf-8") as f:
            f.write(payload.transcription_text)
    except Exception:
        raise HTTPException(status_code=500, detail="Не удалось обновить файл транскрипции")

    return {
        "id": audio.id,
        "filename": audio.filename,
        "transcription_text": payload.transcription_text
    }

@router.delete("/audio/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio(
    audio_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    try:
        if audio.folder_path:
            shutil.rmtree(audio.folder_path, ignore_errors=True)
    except Exception:
        pass

    db.delete(audio)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# @router.delete("/audio/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_audio(
#     audio_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
#
#     audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
#     if not audio:
#         raise HTTPException(status_code=404, detail="Запись не найдена")
#
#     if os.path.exists(audio.folder_path):
#         shutil.rmtree(audio.folder_path)
#
#     db.delete(audio)
#     db.commit()
#     return Response(status_code=status.HTTP_204_NO_CONTENT)