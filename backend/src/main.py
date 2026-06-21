from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.database import engine, Base
from backend.src.routers import audio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bilingual Speech Backend API")

# The origins that are allowed to make requests to backend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.93.26.206:5173",
]

# The CORS middleware to app instance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(audio.router)
