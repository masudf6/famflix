import socket

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.models.user import User
from app.models.media import Media
from app.models.media_file import MediaFile
from app.routes.auth import router as auth_router
from app.routes.media import router as media_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Streaming Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://famflix.local",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(media_router)


@app.get("/")
def root():
    return {"message": "API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/whoami")
def whoami():
    return {"pod": socket.gethostname()}