# Deployment View

```mermaid
flowchart LR
    Browser["User Browser"]
    Frontend["Frontend Server<br/>React/Vite<br/>port 5173"]
    Backend["Backend Server<br/>FastAPI/Uvicorn<br/>port 8000"]
    Database[("PostgreSQL<br/>port 15432->5432")]
    Storage[("Local Storage<br/>./storage")]
    Models["ML Runtime and Model Cache<br/>Whisper, MMS-LID, ECAPA"]

    Browser -->|"HTTPS/HTTP"| Frontend
    Frontend -->|"API calls to /api/v1"| Backend
    Backend -->|"SQLAlchemy"| Database
    Backend -->|"read/write artifacts"| Storage
    Backend -->|"load/infer"| Models
```

The current deployment is a local or VM-style deployment. PostgreSQL can run in Docker, while the backend and frontend run as separate development servers. Audio and transcript artifacts are stored on the backend host filesystem under `storage/<audio_id>/`.
