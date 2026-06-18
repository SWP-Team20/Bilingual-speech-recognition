from fastapi import FastAPI
from src.database import engine, Base
from src.routers import audio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bilingual Speech Backend API")

app.include_router(audio.router)
