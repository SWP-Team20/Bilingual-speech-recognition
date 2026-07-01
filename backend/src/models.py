from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Text, ForeignKey, Index, Enum, JSON
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from backend.src.database import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    MANAGER = "manager"
    ADMIN = "admin"


class User(Base):
    """Модель пользователя только для авторизации и проверки прав."""
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class AudioFile(Base):
    """Запись аудио. Сами файлы лежат на диске в storage/<id>/:
    original_16k.wav, processed.wav, transcription.txt/json.
    В БД — только метаданные и путь к папке."""
    __tablename__ = "audio_files"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.now)
    recorded_at = Column(DateTime, nullable=True, index=True)   # дата записи — ФИЛЬТР по дате
    folder_path = Column(String, nullable=False)

    primary_language = Column(String, nullable=True)
    status = Column(String, default="processing_audio")        # processing_audio/processing_text/done/error

    duration_sec = Column(Float, nullable=True)
    speech_sec = Column(Float, nullable=True)
    silence_removed_sec = Column(Float, nullable=True)
    total_words = Column(Integer, nullable=True)
    unique_words = Column(Integer, nullable=True)
    words_per_minute = Column(Float, nullable=True)
    ru_words = Column(Integer, nullable=True)
    tt_words = Column(Integer, nullable=True)
    unknown_words = Column(Integer, nullable=True)
    avg_confidence = Column(Float, nullable=True)

    words = relationship("Word", back_populates="audio", cascade="all, delete-orphan")
    word_counts = relationship("WordCount", back_populates="audio", cascade="all, delete-orphan")
    segments = relationship("SpeechSegment", back_populates="audio", cascade="all, delete-orphan")


class Speaker(Base):
    """Говорящий (мама/папа/ребёнок). Глобальный по корпусу: один человек —
    одна запись, на него ссылаются слова из разных аудио. Идентификация между
    записями — по ECAPA-эмбеддингу голоса, а не по метке «Говорящий N»."""
    __tablename__ = "speakers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String, index=True)                    # 'мама' / 'папа' / 'Говорящий 1' …
    embedding = Column(JSON, nullable=True)               # нормализованный центроид голоса
    created_at = Column(DateTime, default=datetime.now)

    words = relationship("Word", back_populates="speaker")


class SpeechSegment(Base):
    """Карта VAD: соответствие координат оригинала и обрезанного файла."""
    __tablename__ = "speech_segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    audio_id = Column(PG_UUID(as_uuid=True), ForeignKey("audio_files.id", ondelete="CASCADE"), index=True)
    orig_start = Column(Float)
    orig_end = Column(Float)
    trim_start = Column(Float)
    trim_end = Column(Float)

    audio = relationship("AudioFile", back_populates="segments")


class Word(Base):
    """Каждое слово аудио = одна строка. Это «место для всех слов» для поиска.
    Поиск строится поверх text (в Postgres — добавить tsvector + GIN-индекс)."""
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    audio_id = Column(PG_UUID(as_uuid=True), ForeignKey("audio_files.id", ondelete="CASCADE"), index=True)
    text = Column(String, index=True)                  # нормализованное слово — ФИЛЬТР по слову
    raw = Column(String, nullable=True)                # как выдала ASR (с пунктуацией), для показа
    start_sec = Column(Float)          # координаты ОРИГИНАЛА (транскрипция по оригиналу)
    end_sec = Column(Float)
    language = Column(String, index=True)              # 'ru'/'tt'/'unknown' — ФИЛЬТР по языку
    confidence = Column(Float)
    position = Column(Integer)          # порядковый номер слова в аудио
    speaker_id = Column(Integer, ForeignKey("speakers.id", ondelete="SET NULL"),
                        nullable=True, index=True)     # кто сказал — ФИЛЬТР по говорящему (NULL до диаризации)

    audio = relationship("AudioFile", back_populates="words")
    speaker = relationship("Speaker", back_populates="words")


class WordCount(Base):
    """Кол-во вхождений каждого слова В ПРЕДЕЛАХ одного аудио (для статистики)."""
    __tablename__ = "word_counts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    audio_id = Column(PG_UUID(as_uuid=True), ForeignKey("audio_files.id", ondelete="CASCADE"), index=True)
    text = Column(String, index=True)
    language = Column(String, index=True)
    count = Column(Integer)

    audio = relationship("AudioFile", back_populates="word_counts")


# Индекс под поиск по слову+языку
Index("ix_words_text_lang", Word.text, Word.language)
