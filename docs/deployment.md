# Setup & Deployment Guide

This document covers local development setup (without virtual environments) and production deployment workflows.

## System Prerequisites

* **Docker** (v24.0+)
* **Python** (3.10+)
* **Node.js & npm** (v18+)

> **Audio dependencies**: no system audio libraries are required. Audio decoding and
> the Silero VAD are bundled with `faster-whisper` (via PyAV/onnxruntime), so a system
> `ffmpeg`/`libsndfile` install is **not** needed.

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
pip install -r backend/requirements.txt

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



