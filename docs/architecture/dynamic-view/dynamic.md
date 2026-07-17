# Dynamic View

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Web UI)
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant Storage as Local Storage
    participant Pipeline as ASR Pipeline

    Client->>API: POST /api/v1/upload-audio/ (audio, title?, recorded_at?)
    API->>API: Validate JWT role (manager/admin)
    API->>Storage: Save original audio as storage/<audio_id>/original.<ext>
    API->>DB: Insert audio_files row (status=processing_audio)
    API-->>Client: 202 Accepted + audio metadata

    API->>Pipeline: Start background_process_audio(...)
    Pipeline->>Storage: Write original_16k.wav and processed.wav
    Pipeline->>DB: Update status=processing_text
    Pipeline->>Pipeline: VAD, diarization, LID, ru/tt ASR, word tagging
    Pipeline->>Storage: Write transcription.json and transcription.txt
    Pipeline->>DB: Save words, speakers, word counts, segments, metrics
    Pipeline->>DB: Update status=done

    Client->>API: GET /api/v1/audio/{audio_id}/status
    API-->>Client: done
    Client->>API: GET /api/v1/transcriptions/{audio_id}
    API->>Storage: Read transcription.json
    API-->>Client: words + sentences + transcript text
```

The upload endpoint returns before ASR processing is complete. The frontend relies on status polling and then fetches the transcript, audio, or statistics through protected API endpoints.
