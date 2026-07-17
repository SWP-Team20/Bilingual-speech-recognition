# Bilingual Speech Recognition Documentation

Bilingual Speech Recognition is a web application for uploading bilingual Russian/Tatar audio, processing it through an ASR pipeline, reviewing transcripts, searching the corpus, and analyzing word statistics by language, speaker, date, and recording.

## Current Architecture

- **Frontend:** React/Vite single-page application.
- **Backend:** FastAPI API under `/api/v1`.
- **Database:** PostgreSQL for users, audio metadata, searchable words, speakers, speech segments, and statistics fields.
- **File storage:** local `storage/<audio_id>/` folders for original audio, normalized audio, processed audio, and transcript artifacts.
- **ASR pipeline:** VAD, optional ECAPA diarization, ru/tt language routing, Russian Whisper ASR, Tatar Whisper ASR, per-word language tagging, transcript generation, and database indexing.

## Main Entry Points

- [Setup and Deployment](deployment.md)
- [Architecture](architecture/README.md)
- [Storage and Search](storage_and_search.md)
- [RU/TT Pipeline](ru_tt_pipeline.md)
- [Database Schema](db_schema.md)
- [ASR Training Guide](asr_training_guide.md)
- [Testing](testing.md)
- [Quality Requirements](quality-requirements.md)
