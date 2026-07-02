```mermaid
flowchart LR
    Browser["User Browser"]
    Frontend["Frontend Server<br/>React/Vite"]
    Backend["Backend Server<br/>FastAPI"]
    Database[("PostgreSQL")]
    Storage[("Local Storage")]
    Pipeline["ASR Runtime"]

    Browser --> Frontend
    Frontend --> Backend
    Backend --> Database
    Backend --> Storage
    Backend --> Pipeline