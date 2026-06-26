from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.database import engine, Base
from backend.src.routers import audio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bilingual Speech Backend API")

origins = [
    "https://10.93.26.206:5173",
    "https://127.0.0.1:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # dev: разрешаем локальные/LAN origin'ы фронта (Vite на любом интерфейсе/порту)
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio.router)
