from fastapi import FastAPI
from app.db import Base, engine

from app.models.user import User
from app.models.media import Media
from app.models.media_file import MediaFile

from app.routes.auth import router as auth_router
from app.routes.media import router as media_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Streaming Platform API")

app.include_router(auth_router)
app.include_router(media_router)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

import socket

@app.get("/whoami")
def whoami():
    return {"I am pod": socket.gethostname()}