# Setup and Deployment Guide

This document covers local development setup and the current deployment workflow.

## System Prerequisites

- **Docker** v24.0+
- **Python** 3.10+ with **pip** 22.0+
- **Node.js and npm** compatible with the Vite frontend (`package.json` currently requires Node 20.19+ or 22.12+)

## Verify Prerequisites

```bash
docker --version
python --version
python -m pip --version
node --version
npm --version
```

## 1. Clone the Repository

```bash
git clone https://github.com/SWP-Team20/Bilingual-speech-recognition
cd Bilingual-speech-recognition
```

## 2. Start PostgreSQL

Delete any previous local Postgres container with the same name:

```bash
docker rm -f pg-container
```

Start PostgreSQL in the background:

```bash
docker run -d --name pg-container -v db_storage:/var/lib/postgresql -e POSTGRES_PASSWORD=admin -p 15432:5432 postgres
```

The backend expects database settings through the local `.env` file and `backend/src/database.py`.

## 3. Initialize the Database

Run `init_db.py` from the repository root:

```bash
python init_db.py
```

This creates the initial **admin** user used to create other users.

## 4. Run the Backend

On Linux/macOS, create and activate a virtual environment first:

```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --reload
```

For HTTPS local testing:

```bash
uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --ssl-keyfile=key.pem --ssl-certfile=cert.pem --reload
```

Interactive API docs:

- Local HTTP: `http://localhost:8000/docs`
- VM HTTP: `http://<YOUR-IP-ADDRESS>:8000/docs`
- Local HTTPS: `https://localhost:8000/docs`
- VM HTTPS: `https://<YOUR-IP-ADDRESS>:8000/docs`

Troubleshooting:

- If `uvicorn` is not found, run it through Python: `python -m uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --reload`.
- On Windows, if the backend freezes after reload, run `taskkill /F /IM python.exe` and start the backend again.

## 5. Run the Frontend

Open a new terminal and install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

For HTTPS local testing:

```bash
npm run dev:https
```

Local web app:

- HTTP local: `http://localhost:5173`
- HTTP VM: `http://<YOUR-IP-ADDRESS>:5173`
- HTTPS local: `https://localhost:5173`
- HTTPS VM: `https://<YOUR-IP-ADDRESS>:5173`

Troubleshooting:

- If the frontend is not reachable from another host, run `npm run dev -- --host`.
