
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Web/UI)
    participant API as API Gateway / Backend
    participant Audio as Audio Preprocessor
    participant Model as Speech Recognition Model
    participant DB as Database

    Client->>API: POST /recognize (Audio File)
    activate API
    API->>DB: Save request metadata (Status: Pending)
    
    API->>Audio: Send audio for processing
    activate Audio
    Audio-->>API: Return processed audio chunks
    deactivate Audio
    
    Audio->>Model: Process chunks (Detect Language & Transcribe)
    activate Model
    Model-->>API: Return Bilingual Text Data
    deactivate Model
    
    API->>DB: Update status & save final transcription
    API-->>Client: HTTP 200 OK (JSON with Text)
    deactivate API
