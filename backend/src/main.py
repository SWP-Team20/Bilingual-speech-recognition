from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from backend.src.database import engine, Base
from backend.src.routers import audio, auth, admin, speakers, stats

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE speakers ADD COLUMN IF NOT EXISTS embedding JSON"))

app = FastAPI(title="Bilingual Speech Backend API")

origins = [
    "https://10.93.26.206:5173",
    "https://127.0.0.1:5173",
    "https://localhost:5173",
    "http://10.93.26.206:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Range"],
)

app.include_router(audio.router, prefix="/api/v1")
app.include_router(speakers.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
