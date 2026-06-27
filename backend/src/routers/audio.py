import json
import os
import shutil
import logging
from uuid import UUID, uuid4
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Response, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db, SessionLocal
from backend.src.models import User, UserRole
from backend.src.dependencies import get_current_user
import backend.src.pipeline as pipeline

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


# --- ALL ROLES (ADMIN, MANAGER, USER) ---

@router.get("/audio/", response_model=List[schemas.AudioFileResponse])
async def get_all_audio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(models.AudioFile).all()


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
        # If it's a frontend 'temp-' placeholder ID, catch it here 
        # and return 202 Accepted so Axios doesn't throw a console error.
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
        raise HTTPException(status_code=400, detail="Используйте type='original' или type='processed'")

    if not os.path.exists(file_path):
        if audio.status in ["processing_audio", "processing"]:
            return Response(status_code=status.HTTP_202_ACCEPTED)
        
        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    return FileResponse(path=file_path, media_type=media_type, filename=f"{type}_{audio.filename}")


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


@router.get("/search/")
async def search_words(
    q: str = None,
    lang: str = None,
    speaker: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Поиск по корпусу с фильтрами (все необязательны):
      q         — слово (точное совпадение нормализованного text);
      lang      — 'ru' / 'tt';
      speaker   — метка говорящего (мама/папа); работает после диаризации;
      date_from / date_to — диапазон по дате записи (recorded_at, ISO 'YYYY-MM-DD').
    Возвращает вхождения слова + таймкод оригинала (для перехода в плеере)."""
    query = (db.query(models.Word)
             .join(models.AudioFile, models.AudioFile.id == models.Word.audio_id))
    if q:
        query = query.filter(models.Word.text == q.strip().lower())
    if lang:
        query = query.filter(models.Word.language == lang)
    if speaker:
        query = (query.join(models.Speaker, models.Speaker.id == models.Word.speaker_id)
                 .filter(models.Speaker.label == speaker))
    if date_from:
        query = query.filter(models.AudioFile.recorded_at >= date_from)
    if date_to:
        query = query.filter(models.AudioFile.recorded_at < date_to)
    hits = query.all()
    return [{
        "audio_id": str(h.audio_id), "text": h.text, "raw": h.raw,
        "language": h.language, "start_sec": h.start_sec, "end_sec": h.end_sec,
        "confidence": h.confidence,
        "speaker": h.speaker.label if h.speaker else None,
        "recorded_at": h.audio.recorded_at.isoformat() if h.audio and h.audio.recorded_at else None,
    } for h in hits]


@router.get("/transcriptions/", response_model=List[schemas.AudioWithTextResponse])
async def get_all_transcriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_files = db.query(models.AudioFile).all()
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

    if os.path.exists(audio.folder_path):
        shutil.rmtree(audio.folder_path)

    db.delete(audio)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)