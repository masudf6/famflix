import socket

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.models.user import User
from app.models.media import Media
from app.models.media_file import MediaFile
from app.models.chat import ChatMessage, ChatMention, ChatReadState
from app.routes.auth import router as auth_router
from app.routes.media import router as media_router
from app.routes.users import router as users_router
from app.routes.chat import router as chat_router
from app.routes.agent import router as agent_router
from app.services.schema_migrations import ensure_runtime_columns

Base.metadata.create_all(bind=engine)
ensure_runtime_columns(engine)

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
app.include_router(users_router)
app.include_router(chat_router)
app.include_router(agent_router)


@app.get("/")
def root():
    return {"message": "API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/whoami")
def whoami():
    return {"pod": socket.gethostname()}