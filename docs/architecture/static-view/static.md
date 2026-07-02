```mermaid
flowchart LR
    User["User"]
    Frontend["React/Vite Frontend"]
    Backend["FastAPI Backend"]
    Database[("PostgreSQL Database")]
    Storage[("Local File Storage")]
    Pipeline["ASR Processing Pipeline"]

    User --> Frontend
    Frontend -->|"HTTP API requests"| Backend
    Backend -->|"Metadata"| Database
    Backend -->|"Audio and transcript files"| Storage
    Backend -->|"Start transcription"| Pipeline
    Pipeline -->|"Read/write files"| Storage
    Pipeline -->|"Save results"| Database