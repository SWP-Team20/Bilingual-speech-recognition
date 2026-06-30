from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional

from backend.src.models import UserRole

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    folder_path: str
    uploaded_at: datetime
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

class UpdateAudioNameRequest(BaseModel):
    filename: str

class UpdateAudioDateRequest(BaseModel):
    uploaded_at: datetime