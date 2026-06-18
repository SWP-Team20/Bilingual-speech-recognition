from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from backend.src.database import Base


class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)

    uploaded_at = Column(DateTime, default=datetime.now)

    folder_path = Column(String, nullable=False)