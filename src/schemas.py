from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    file_path: str
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
