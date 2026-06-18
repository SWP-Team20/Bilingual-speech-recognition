# Setup & Deployment Guide

This document covers local development setup (without virtual environments) and production deployment workflows.

## System Prerequisites

* **Docker** (v24.0+)
* **Python** (3.10+)
* **Node.js & npm** (v18+)

> **Critical Audio Dependency**: The Python `soundfile` library requires `libsndfile`. If running locally without Docker, install it manually:
> * **macOS**: `brew install libsndfile ffmpeg`
> * **Ubuntu/Debian**: `sudo apt-get install libsndfile1 ffmpeg`

## Deployment

Follow these steps to run the application.

### 1. Clone the Repository

```bash
git clone https://github.com/SWP-Team20/Bilingual-speech-recognition
cd your-repo
```

### 2. Build and Launch Containers
Open Docker Desktop and delete a container in **Containers** section if it has the name **pg-container**

Run this command from the project root directory on your production server to start and deploy Docker:
```bash
docker run --name pg-container -e POSTGRES_PASSWORD=admin -p 15432:5432 postgres
```

### 3. Run the Backend (FastAPI)

```bash
# Install dependencies
pip install fastapi pydantic psycopg sqlalchemy librosa soundfile uuid uvicorn

# Start the API development server
python -m uvicorn backend.src.main:app --port 8000 --reload
```

* **Interactive API Docs**: http://localhost:8000/docs

> **Troubleshooting**: If the backend is frozen after reload, type ```taskkill /F /IM python.exe``` and run the backend again.

### 4. Run the Frontend (Node.js)
Open a new terminal window:
```bash
cd frontend

# Install package dependencies
npm install

# Start the server
npm run dev
```
* **Local Web App**: http://localhost:5173



