# Setup & Deployment Guide

This document covers development setup and production deployment workflows.

## System Prerequisites

* **Docker** (v24.0+)
* **Python** (3.10+) with **PIP** (v22.0+)
* **Node.js & npm** (v20.19+)

### Verify Prerequisites
```bash
docker --version
python3 --version
python3 -m pip --version
node --version
```

## Deployment

Follow these steps to run the application.

### 1. Clone the Repository

```bash
git clone https://github.com/SWP-Team20/Bilingual-speech-recognition
cd Bilingual-speech-recognition
```

### 2. Build and Launch Containers

Firstly, delete previous containers if existed:
```bash
docker rm -v pg-container
```

Run this command to start and deploy Docker in the background:
```bash
docker run -d --name pg-container -e POSTGRES_PASSWORD=admin -p 15432:5432 postgres
```

### 3. Run the Backend (FastAPI)

> If your system is Linux, firstly create and initialize venv:
> 
> ```bash
> python3 -m venv venv
> source .venv/bin/activate
> ```

Install dependencies and start the API development server:

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --reload
```

Interactive API Docs:
* ```http://localhost:8000/docs``` if deployed locally
* ```http://<YOUR-IP-ADDRESS>:8000/docs``` if deployed on VM

> **Troubleshooting**: If the backend has frozen after reload, type ```taskkill /F /IM python.exe``` and run the backend again.

### 4. Run the Frontend (Node.js)
Open a new terminal window. Now install package dependencies and start the server:
```bash
cd frontend
npm install
npm run dev -- --host
```

Local Web App:
* ```http://localhost:5173``` if deployed locally
* ```http://<YOUR-IP-ADDRESS>:5173``` if deployed on VM



