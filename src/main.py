from fastapi import FastAPI
from database import engine, Base
from routers import audio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bilingual Speech Backend API")

app.include_router(audio.router)
