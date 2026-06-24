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
docker rm -f pg-container
```

Run this command to start and deploy Docker in the background:
```bash
docker run -d --name pg-container -v db_storage:/var/lib/postgresql -e POSTGRES_PASSWORD=admin -p 15432:5432 postgres
```

### 3. Run the Backend (FastAPI)

> If your system is Linux, firstly create and initialize venv:
> 
> ```bash
> python3 -m venv venv
> source .venv/bin/activate
> ```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Then, start the API backend server via uvicorn:


- **HTTP** protocol:
```bash
uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --reload
```

- **HTTPS** protocol:
```bash
uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --ssl-keyfile=key.pem --ssl-certfile=cert.pem --reload 
```

Interactive API Docs:
* HTTP:
  * ```http://localhost:8000/docs``` if deployed locally
  * ```http://<YOUR-IP-ADDRESS>:8000/docs``` if deployed on VM

* HTTPS:
  * ```https://localhost:8000/docs``` if deployed locally
  * ```https://<YOUR-IP-ADDRESS>:8000/docs``` if deployed on VM

> **Troubleshooting**:
>
> 1. If you have an error while trying to start the server, try inserting at the start of the command ```python -m```. For example:
> ```bash
> python -m uvicorn backend.src.main:app --port 8000 --host 0.0.0.0 --reload
> ```
> 
>
> 2. If the backend has frozen after reload, type ```taskkill /F /IM python.exe``` and run the backend again.

### 4. Run the Frontend (Node.js)
Open a new terminal window. Now install package dependencies:
```bash
cd frontend
npm install
```

Now start the server:


- **HTTP** protocol:
```bash
npm run dev
```

- **HTTPS** protocol:
```bash
npm run dev:https
```

> **Troubleshooting**:
>
> 1. If you have an error while trying to start the frontend, try adding ```-- --host```. For example:
> ```bash
> npm run dev -- --host
> ```

Local Web App:
* HTTP
  * ```http://localhost:5173``` if deployed locally with
  * ```http://<YOUR-IP-ADDRESS>:5173``` if deployed on VM

* HTTPS
  * ```https://localhost:5173``` if deployed locally
  * ```https://<YOUR-IP-ADDRESS>:5173``` if deployed on VM



