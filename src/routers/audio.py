import os
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.database import get_db
from src import models
from src import schemas

router = APIRouter(
    prefix="/audio",
    tags=["Audio"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-audio/", response_model=schemas.AudioFileResponse)
async def upload_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Файл должен быть аудиоформата")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    db_audio = models.AudioFile(
        filename=file.filename,
        file_path=file_path,
        content_type=file.content_type
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)

    return db_audio


@router.get("/{audio_id}", response_class=FileResponse)
async def get_audio(audio_id: UUID, db: Session = Depends(get_db)):
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Аудиофайл не найден")

    if not os.path.exists(audio.file_path):
        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    return FileResponse(path=audio.file_path, media_type=audio.content_type, filename=audio.filename)

#TODO: add PATCH and DELETE routes
