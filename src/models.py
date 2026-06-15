import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from database import Base

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    content_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)