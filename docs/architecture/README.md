# Architecture Documentation

This directory contains the maintained architecture documentation for the Bilingual Speech Recognition project.

The delivered product uses a React/Vite frontend, a FastAPI backend, PostgreSQL metadata storage, local file storage for audio and transcript artifacts, and a backend-side ASR processing pipeline.

## Static View

The [static view](static-view/static.md) shows the main structural components:

- user browser and React/Vite frontend;
- FastAPI backend under `/api/v1`;
- authentication, audio, speaker, statistics, and admin routers;
- PostgreSQL database;
- local `storage/<audio_id>/` artifact folders;
- ASR pipeline modules for preprocessing, diarization, language identification, transcription, tagging, and indexing.

This view is important because it explains the main responsibility boundaries. The frontend handles user interaction, while the backend owns authorization, persistence, processing coordination, file access, and ML pipeline execution.

## Dynamic View

The [dynamic view](dynamic-view/dynamic.md) describes the primary runtime workflow: a manager/admin uploads audio through `POST /api/v1/upload-audio/`, the backend stores the file and metadata, processing continues in a background task, and clients poll status and fetch transcript/audio artifacts when processing is complete.

## Deployment View

The [deployment view](deployment-view/deployment.md) describes the current local/VM deployment model:

- browser accesses the Vite frontend server;
- frontend calls the FastAPI backend;
- backend connects to PostgreSQL;
- backend and ASR runtime read/write local storage;
- ML models are loaded by the backend process.

This deployment model is simple and suitable for the current MVP, but it keeps file storage and ML processing local to the backend host. Those constraints should be revisited before production-scale deployment.

## Architecture Decisions

- [ADR-001: Audio Confidentiality](adr/ADR-001-audio-confidentiality.md)
- [ADR-002: Frontend Build Quality](adr/ADR-002-frontend-build-quality.md)
- [ADR-003: Pull Request Compliance](adr/ADR-003-pull-request-compliance.md)
