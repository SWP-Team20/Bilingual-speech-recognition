from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.src.models import UserRole

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
    old_password: str = Field(
        ..., min_length=6, description="Старый пароль"
    )
    new_password: str = Field(
        ...,
        min_length=6,
        description="Новый пароль, минимум 6 символов",
    )
    confirm_password: str = Field(
        ...,
        min_length=6,
        description="Подтверждение нового пароля",
    )

    @model_validator(mode="after")
    def validate_passwords(self) -> "ChangePasswordRequest":
        # 1. Проверяем совпадение нового пароля и подтверждения
        if self.new_password != self.confirm_password:
            raise ValueError(
                "Новый пароль и подтверждение не совпадают"
            )

        # 2. Проверяем, что новый пароль изменен
        if self.old_password == self.new_password:
            raise ValueError(
                "Новый пароль не должен совпадать со старым"
            )

        return self