from datetime import datetime
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.src.models import UserRole

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    folder_path: str
    uploaded_at: datetime
    recorded_at: datetime | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class AudioStatusResponse(BaseModel):
    id: UUID
    status: str

class AudioWithTextResponse(BaseModel):
    id: UUID
    filename: str
    transcription_text: str

    model_config = ConfigDict(from_attributes=True)

class UpdateTranscriptionRequest(BaseModel):
    transcription_text: str


_VALID_LANGS = ("ru", "tt", "unknown")


class WordEditRequest(BaseModel):
    """Правка одного слова: видимая форма (raw), нормализованная (text) и/или язык."""
    raw: str | None = Field(default=None, description="Видимое слово (как показывается)")
    text: str | None = Field(default=None, description="Нормализованная форма для поиска; по умолчанию выводится из raw")
    language: str | None = Field(default=None, description="Языковой тег: ru / tt / unknown")

    @model_validator(mode="after")
    def _check(self):
        if self.raw is None and self.text is None and self.language is None:
            raise ValueError("Укажите raw, text или language")
        if self.language is not None and self.language not in _VALID_LANGS:
            raise ValueError("language должен быть ru / tt / unknown")
        return self


class WordInsertRequest(BaseModel):
    """Добавление нового слова по индексу вставки."""
    position: int = Field(..., ge=0, description="Индекс вставки (0..N)")
    raw: str = Field(..., min_length=1, description="Слово")
    language: str = Field(default="unknown", description="Языковой тег: ru / tt / unknown")

    @model_validator(mode="after")
    def _check(self):
        if self.language not in _VALID_LANGS:
            raise ValueError("language должен быть ru / tt / unknown")
        return self


class UpdateAudioMetadataRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    recorded_at: str | None = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Имя пользователя")
    password: str = Field(..., min_length=4, description="Пароль минимум 4 символа")
    # Используем UserRole вместо str. Pydantic сам проверит валидность роли.
    role: UserRole = Field(default=UserRole.USER, description="Уровень доступа: user, manager, admin")

class UserResponse(BaseModel):
    id: UUID
    username: str
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=4, description="Старый пароль")
    new_password: str = Field(
        ..., min_length=4, description="Новый пароль, минимум 4 символа"
    )
    confirm_password: str = Field(
        ..., min_length=4, description="Подтверждение нового пароля"
    )

class AudioFileSizes(BaseModel):
    original_mb: float
    original_16k_mb: float
    processed_mb: float
    transcription_txt_mb: float
    transcription_json_mb: float
    total_folder_mb: float

class TotalStorageResponse(BaseModel):
    total_allocated_mb: float


class SearchHitResponse(BaseModel):
    audio_id: UUID
    text: str
    raw: str | None = None
    language: str
    start_sec: float
    end_sec: float
    confidence: float | None = None
    speaker: str | None = None
    recorded_at: datetime | None = None


class SpeakerResponse(BaseModel):
    id: int
    label: str
    created_at: datetime
    audio_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class UpdateSpeakerRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=100, description="Новая метка говорящего")


class WordFrequencyItem(BaseModel):
    text: str
    language: str
    count: int


class FrequentWordsResponse(BaseModel):
    items: List[WordFrequencyItem]
    total_words: int
    unique_words: int
    limit: int


class StatsRebuildResponse(BaseModel):
    processed: int
    from_json: bool