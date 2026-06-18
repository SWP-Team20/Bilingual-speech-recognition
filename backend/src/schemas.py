from datetime import datetime
from uuid import UUID  # Тот же самый класс UUID
from pydantic import BaseModel, ConfigDict

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    folder_path: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AudioWithTextResponse(BaseModel):
    id: UUID
    filename: str
    transcription_text: str

    model_config = ConfigDict(from_attributes=True)

class UpdateTranscriptionRequest(BaseModel):
    transcription_text: str