import json
import os
import shutil
import logging
from uuid import UUID, uuid4
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query, Response, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db, SessionLocal
from backend.src.models import User, UserRole
from backend.src.dependencies import get_current_user
import backend.src.pipeline as pipeline
from backend.src.services.audio_filter import CorpusFilters, filter_audio_files, filter_word_hits

router = APIRouter()
logger = logging.getLogger(__name__)

BASE_STORAGE_DIR = "./storage"
os.makedirs(BASE_STORAGE_DIR, exist_ok=True)


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
    q: Optional[str] = Query(None, description="Слово (точное совпадение нормализованного text)"),
    lang: Optional[str] = Query(None, description="Язык слова: ru / tt / unknown"),
    speaker: Optional[str] = Query(None, description="Метка говорящего (мама / папа / …)"),
    date_from: Optional[str] = Query(None, description="Дата записи с (ISO YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата записи по, включительно (ISO YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Статус обработки: done / processing / error / …"),
) -> CorpusFilters:
    return CorpusFilters(
        word=q,
        lang=lang,
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
        file_path = os.path.join(audio.folder_path, f"original{file_ext}")
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
        "original": os.path.join(folder, f"original{file_ext}"),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Файл должен быть аудиоформата")

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
        filename=file.filename,
        content_type=file.content_type,
        folder_path=folder_path,
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