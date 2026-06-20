import os
import shutil
from uuid import UUID, uuid4
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db

import backend.src.pipeline as pipeline

router = APIRouter()

BASE_STORAGE_DIR = "./storage"
os.makedirs(BASE_STORAGE_DIR, exist_ok=True)


@router.post("/upload-audio/", response_model=schemas.AudioFileResponse)
async def upload_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
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

    # запись метаданных до индексации (db_index обновляет метрики этой строки)
    db_audio = models.AudioFile(
        id=audio_id,
        filename=file.filename,
        content_type=file.content_type,
        folder_path=folder_path,
    )
    db.add(db_audio)
    db.commit()

    # полный пайплайн: VAD -> транскрипция оригинала -> теги -> индексация в БД
    pipeline.process_audio(
        input_path=orig_file_path,
        storage_dir=BASE_STORAGE_DIR,
        audio_id=str(audio_id),
        original_filename=file.filename,
        db=db,
    )

    db.refresh(db_audio)
    return db_audio


@router.get("/search/")
async def search_words(q: str, lang: str = None, db: Session = Depends(get_db)):
    """Поиск слова по корпусу: где встречается + таймкод оригинала (для перехода)."""
    query = db.query(models.Word).filter(models.Word.text == q.strip().lower())
    if lang:
        query = query.filter(models.Word.language == lang)
    hits = query.all()
    return [{
        "audio_id": str(h.audio_id), "text": h.text, "language": h.language,
        "start_sec": h.start_sec, "end_sec": h.end_sec, "confidence": h.confidence,
    } for h in hits]


@router.get("/audio/", response_model=List[schemas.AudioFileResponse])
async def get_all_audio(db: Session = Depends(get_db)):
    return db.query(models.AudioFile).all()


@router.get("/audio/{audio_id}")
async def get_audio_by_id(audio_id: UUID, type: str = "original", db: Session = Depends(get_db)):
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    file_ext = os.path.splitext(audio.filename)[1] or ".mp3"

    if type == "original":
        file_path = os.path.join(audio.folder_path, f"original{file_ext}")
    elif type == "processed":
        file_path = os.path.join(audio.folder_path, f"processed{file_ext}")
    else:
        raise HTTPException(status_code=400, detail="Используйте type='original' или type='processed'")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    return FileResponse(path=file_path, media_type=audio.content_type, filename=f"{type}_{audio.filename}")


@router.patch("/audio/{audio_id}/processed", response_model=schemas.AudioFileResponse)
async def update_processed_audio(audio_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
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


@router.get("/transcriptions/", response_model=List[schemas.AudioWithTextResponse])
async def get_all_transcriptions(db: Session = Depends(get_db)):
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


@router.get("/transcriptions/{audio_id}", response_model=schemas.AudioWithTextResponse)
async def get_transcription_by_id(audio_id: UUID, db: Session = Depends(get_db)):
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    text_file_path = os.path.join(audio.folder_path, "transcription.txt")
    if not os.path.exists(text_file_path):
        raise HTTPException(status_code=404, detail="Файл транскрипции отсутствует")

    with open(text_file_path, "r", encoding="utf-8") as f:
        text_content = f.read()

    return {
        "id": audio.id,
        "filename": audio.filename,
        "transcription_text": text_content
    }


@router.delete("/audio/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio(audio_id: UUID, db: Session = Depends(get_db)):
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if os.path.exists(audio.folder_path):
        shutil.rmtree(audio.folder_path)

    db.delete(audio)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/transcriptions/{audio_id}", response_model=schemas.AudioWithTextResponse)
async def update_transcription(
    audio_id: UUID,
    payload: schemas.UpdateTranscriptionRequest,
    db: Session = Depends(get_db)
):
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