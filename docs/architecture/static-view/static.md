# Static View

```mermaid
flowchart LR
    User["User"]
    Frontend["React/Vite Frontend"]
    Backend["FastAPI Backend<br/>/api/v1"]
    Auth["Auth Router"]
    Audio["Audio and Transcript Router"]
    Speakers["Speakers Router"]
    Stats["Statistics Router"]
    Admin["Admin Router"]
    Database[("PostgreSQL Database")]
    Storage[("Local File Storage<br/>storage/&lt;audio_id&gt;/")]
    Pipeline["ASR Processing Pipeline"]

    User --> Frontend
    Frontend -->|"HTTP API requests + bearer token"| Backend

    Backend --> Auth
    Backend --> Audio
    Backend --> Speakers
    Backend --> Stats
    Backend --> Admin

    Auth --> Database
    Admin --> Database
    Speakers --> Database
    Stats --> Database
    Audio --> Database
    Audio --> Storage
    Audio -->|"background task"| Pipeline

    Pipeline --> Storage
    Pipeline --> Database
```

The backend is the central integration boundary. It enforces authorization, exposes API endpoints, starts the processing pipeline, serves stored artifacts, and writes searchable metadata to PostgreSQL.
