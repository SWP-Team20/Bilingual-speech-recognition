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


class AudioDeleteResponse(BaseModel):
    id: UUID
    undo_seconds: int
    undo_until: datetime


class UserDeleteResponse(BaseModel):
    id: UUID
    undo_seconds: int
    undo_until: datetime

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
    """Правка слова: видимая форма (raw), нормализованная (text) и/или язык.

    Пустой raw удаляет слово. Несколько слов через пробел разбиваются на отдельные.
    """
    raw: str | None = Field(default=None, description="Видимое слово (как показывается); пустая строка = удалить")
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
    """Добавление слова(ов) по индексу вставки. Несколько слов через пробел — каждое отдельно."""
    position: int = Field(..., ge=0, description="Индекс вставки (0..N)")
    raw: str = Field(..., min_length=1, description="Слово или несколько слов через пробел")
    language: str = Field(default="unknown", description="Языковой тег: ru / tt / unknown")

    @model_validator(mode="after")
    def _check(self):
        if self.language not in _VALID_LANGS:
            raise ValueError("language должен быть ru / tt / unknown")
        if not self.raw.strip():
            raise ValueError("Слово не может быть пустым")
        return self


class WordsBulkRequest(BaseModel):
    """Массовая правка слов по индексам: смена языка, говорящего или удаление."""
    positions: list[int] = Field(..., min_length=1, description="Индексы слов в транскрипции")
    language: str | None = Field(default=None, description="Новый языковой тег для всех выбранных слов")
    delete: bool = Field(default=False, description="Удалить выбранные слова")
    speaker_id: int | None = Field(default=None, description="ID говорящего для назначения выбранным словам")
    new_label: str | None = Field(default=None, min_length=1, max_length=100, description="Новая метка говорящего")

    @model_validator(mode="after")
    def _check(self):
        has_speaker = self.speaker_id is not None or bool(self.new_label and str(self.new_label).strip())
        has_lang = self.language is not None
        has_delete = self.delete
        chosen = sum([has_speaker, has_lang, has_delete])
        if chosen != 1:
            raise ValueError("Укажите одно действие: language, delete=true, или speaker_id/new_label")
        if self.delete and (self.language is not None or has_speaker):
            raise ValueError("Укажите либо language, либо delete=true, либо speaker_id/new_label")
        if self.language is not None and self.language not in _VALID_LANGS:
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


class RelabelSpeakerInAudioRequest(BaseModel):
    """Смена метки говорящего в одной записи (US-030).

    Укажите либо speaker_id (выбрать существующего из корпуса),
    либо new_label (новая метка / найти по имени).

    scope=audio — все вхождения метки в этой записи;
    scope=paragraph — только слова указанных позиций (одно предложение/реплика).
    """
    current_label: str = Field(..., min_length=1, max_length=100, description="Текущая метка в JSON этой записи")
    new_label: str | None = Field(default=None, min_length=1, max_length=100, description="Новая метка")
    speaker_id: int | None = Field(default=None, description="ID существующего говорящего")
    scope: str = Field(default="audio", description="audio | paragraph")
    word_positions: list[int] | None = Field(
        default=None,
        description="Индексы слов для scope=paragraph",
    )

    @model_validator(mode="after")
    def _check(self):
        has_label = self.new_label is not None and bool(str(self.new_label).strip())
        if self.speaker_id is None and not has_label:
            raise ValueError("Укажите new_label или speaker_id")
        scope = (self.scope or "audio").strip().lower()
        if scope not in ("audio", "paragraph"):
            raise ValueError("scope должен быть audio или paragraph")
        self.scope = scope
        if scope == "paragraph" and not self.word_positions:
            raise ValueError("Для scope=paragraph укажите word_positions")
        return self


class WordFrequencyItem(BaseModel):
    text: str
    language: str
    count: int


class FrequentWordsResponse(BaseModel):
    items: List[WordFrequencyItem]
    total_words: int
    unique_words: int
    limit: int


class SpeakerWordCountItem(BaseModel):
    speaker_id: int | None
    label: str
    count: int


class SpeakerWordsResponse(BaseModel):
    items: List[SpeakerWordCountItem]
    total_words: int
    total_speakers: int
    limit: int


class LanguageWordCountItem(BaseModel):
    language: str
    label: str
    count: int


class LanguageWordsResponse(BaseModel):
    items: List[LanguageWordCountItem]
    total_words: int


class DateWordCountItem(BaseModel):
    date: str | None
    label: str
    count: int


class DateWordsResponse(BaseModel):
    items: List[DateWordCountItem]
    total_words: int
    total_dates: int
    limit: int


class StatsRebuildResponse(BaseModel):
    processed: int
    from_json: bool