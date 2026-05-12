import re
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.db import SessionLocal, get_db
from app.dependencies import get_current_user
from app.core.security import decode_access_token
from app.models.chat import ChatMention, ChatMessage, ChatReadState
from app.models.media import Media
from app.models.media_file import MediaFile
from app.models.user import User
from app.services.realtime import realtime_manager
from app.services.fam_bot_service import get_or_create_fam_bot, FAM_BOT_EMAIL
from app.schemas.chat import (
    ChatMemberResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatReadUpdate,
    ChatUnreadResponse,
)
from app.schemas.media import MediaFileResponse, MediaResponse

router = APIRouter(prefix="/chat", tags=["chat"])

MENTION_RE = re.compile(r"(?<!\w)@([a-zA-Z0-9_]{1,100})")


# Keep handle generation backend-owned so mentions work consistently across devices.
def make_user_handle(user: User) -> str:
    source = user.display_name or user.full_name or user.email.split("@", 1)[0]
    handle = re.sub(r"[^a-z0-9_]+", "", source.lower().replace(" ", "_"))
    if not handle:
        handle = re.sub(r"[^a-z0-9_]+", "", user.email.split("@", 1)[0].lower())
    return handle or f"user_{str(user.id)[:8]}"


def user_display_name(user: User) -> str:
    return user.display_name or user.full_name or user.email.split("@", 1)[0]


def build_member_response(user: User, current_user_id: UUID) -> ChatMemberResponse:
    is_bot = user.role == "bot"
    presence = realtime_manager.get_status(user.id)
    return ChatMemberResponse(
        id=user.id,
        name=user_display_name(user),
        handle=make_user_handle(user),
        online=True if is_bot else (presence.online or user.id == current_user_id),
        is_current_user=False if is_bot else user.id == current_user_id,
        is_bot=is_bot,
        watching_media_id=None if is_bot else presence.watching_media_id,
        watching_title=None if is_bot else presence.watching_title,
    )


def _media_response(media: Media, media_file: MediaFile | None) -> MediaResponse:
    return MediaResponse(
        id=media.id,
        title=media.title,
        description=media.description,
        media_type=media.media_type,
        thumbnail_url=media.thumbnail_url,
        uploaded_by=media.uploaded_by,
        is_public=True,
        release_year=media.release_year,
        rating=media.rating,
        audience_rating=media.audience_rating,
        genres=media.genres or [],
        tags=media.tags or [],
        created_at=media.created_at,
        file=MediaFileResponse.model_validate(media_file) if media_file else None,
    )


def _normalise_media_ids(raw_ids: list[str] | None) -> list[UUID]:
    parsed: list[UUID] = []
    seen: set[UUID] = set()
    for raw_id in raw_ids or []:
        try:
            media_id = UUID(str(raw_id))
        except (TypeError, ValueError):
            continue
        if media_id not in seen:
            seen.add(media_id)
            parsed.append(media_id)
    return parsed


def _get_media_responses(db: Session, raw_ids: list[str] | None) -> tuple[list[UUID], list[MediaResponse]]:
    media_ids = _normalise_media_ids(raw_ids)
    if not media_ids:
        return [], []

    media_rows = db.query(Media).filter(Media.id.in_(media_ids)).all()
    media_by_id = {media.id: media for media in media_rows}
    file_rows = db.query(MediaFile).filter(MediaFile.media_id.in_(media_ids)).all()
    file_by_media_id = {media_file.media_id: media_file for media_file in file_rows}

    responses: list[MediaResponse] = []
    existing_ids: list[UUID] = []
    for media_id in media_ids:
        media = media_by_id.get(media_id)
        if not media:
            continue
        existing_ids.append(media_id)
        responses.append(_media_response(media, file_by_media_id.get(media_id)))
    return existing_ids, responses


def build_message_response(
    message: ChatMessage,
    author: User,
    mentions: list[ChatMention] | None = None,
    db: Session | None = None,
) -> ChatMessageResponse:
    mention_rows = mentions or []
    media_ids, media_items = _get_media_responses(db, message.media_ids) if db else ([], [])
    return ChatMessageResponse(
        id=message.id,
        author_id=message.author_id,
        author_name=user_display_name(author),
        author_handle=make_user_handle(author),
        text=message.text,
        created_at=message.created_at,
        mentioned_user_ids=[row.mentioned_user_id for row in mention_rows],
        mentioned_handles=[row.handle for row in mention_rows],
        media_ids=media_ids,
        media_items=media_items,
    )


def _get_read_state(db: Session, user_id: UUID) -> ChatReadState | None:
    return db.query(ChatReadState).filter(ChatReadState.user_id == user_id).first()


def _calculate_unread_count(db: Session, user: User, state: ChatReadState | None) -> int:
    query = db.query(ChatMessage).filter(ChatMessage.author_id != user.id)
    if state and state.last_read_at:
        query = query.filter(ChatMessage.created_at > state.last_read_at)
    return query.count()


def _get_author_map(db: Session, messages: list[ChatMessage]) -> dict[UUID, User]:
    author_ids = {message.author_id for message in messages}
    if not author_ids:
        return {}
    users = db.query(User).filter(User.id.in_(author_ids)).all()
    return {user.id: user for user in users}


def _get_mentions_map(db: Session, messages: list[ChatMessage]) -> dict[UUID, list[ChatMention]]:
    message_ids = [message.id for message in messages]
    if not message_ids:
        return {}
    rows = db.query(ChatMention).filter(ChatMention.message_id.in_(message_ids)).all()
    result: dict[UUID, list[ChatMention]] = {}
    for row in rows:
        result.setdefault(row.message_id, []).append(row)
    return result


async def _broadcast_unread_counts(db: Session, users: list[User]) -> None:
    for active_user in users:
        state = _get_read_state(db, active_user.id)
        await realtime_manager.send_to_user(
            active_user.id,
            {
                "type": "unread_updated",
                "unread_count": _calculate_unread_count(db, active_user, state),
                "last_read_message_id": str(state.last_read_message_id) if state and state.last_read_message_id else None,
                "last_read_at": state.last_read_at.isoformat() if state and state.last_read_at else None,
            },
        )


@router.get("/users", response_model=list[ChatMemberResponse])
def list_chat_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fam_bot = get_or_create_fam_bot(db)
    users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            ((User.role != "bot") | (User.email == FAM_BOT_EMAIL)),
        )
        .order_by(User.role.desc(), User.full_name.asc())
        .all()
    )
    if fam_bot not in users:
        users.insert(0, fam_bot)
    return [build_member_response(user, current_user.id) for user in users]


@router.get("/messages", response_model=list[ChatMessageResponse])
def list_messages(
    limit: int = Query(default=100, ge=1, le=200),
    before: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(ChatMessage).join(User, User.id == ChatMessage.author_id).filter(
        User.is_active.is_(True),
        ((User.role != "bot") | (User.email == FAM_BOT_EMAIL)),
    )
    if before:
        query = query.filter(ChatMessage.created_at < before)

    # Get the latest N, then return oldest -> newest for chat rendering.
    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    messages = list(reversed(messages))

    authors = _get_author_map(db, messages)
    mentions = _get_mentions_map(db, messages)

    return [
        build_message_response(
            message=message,
            author=authors.get(message.author_id),
            mentions=mentions.get(message.id, []),
            db=db,
        )
        for message in messages
        if authors.get(message.author_id) is not None
    ]


@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    message = ChatMessage(author_id=current_user.id, text=text)
    db.add(message)
    db.flush()

    active_users = db.query(User).filter(User.is_active.is_(True), User.role != "bot").all()
    users_by_handle = {make_user_handle(user).lower(): user for user in active_users}

    mention_rows: list[ChatMention] = []
    seen_user_ids: set[UUID] = set()
    for raw_handle in MENTION_RE.findall(text):
        handle = raw_handle.lower()
        mentioned_user = users_by_handle.get(handle)
        if not mentioned_user or mentioned_user.id in seen_user_ids:
            continue
        seen_user_ids.add(mentioned_user.id)
        row = ChatMention(
            message_id=message.id,
            mentioned_user_id=mentioned_user.id,
            handle=make_user_handle(mentioned_user),
        )
        db.add(row)
        mention_rows.append(row)

    db.commit()
    db.refresh(message)
    for row in mention_rows:
        db.refresh(row)

    response = build_message_response(message, current_user, mention_rows, db=db)
    await realtime_manager.broadcast(
        {
            "type": "message_created",
            "message": jsonable_encoder(response),
        }
    )

    # no bot reply

    # Push fresh unread counts to connected clients so the navbar badge updates
    # without waiting for the next HTTP refresh.
    active_users = db.query(User).filter(User.is_active.is_(True), User.role != "bot").all()
    await _broadcast_unread_counts(db, active_users)

    return response


@router.get("/unread", response_model=ChatUnreadResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = _get_read_state(db, current_user.id)
    return ChatUnreadResponse(
        unread_count=_calculate_unread_count(db, current_user, state),
        last_read_message_id=state.last_read_message_id if state else None,
        last_read_at=state.last_read_at if state else None,
    )


@router.patch("/read", response_model=ChatUnreadResponse)
async def mark_messages_read(
    payload: ChatReadUpdate | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_message: ChatMessage | None = None
    requested_id = payload.last_read_message_id if payload else None

    if requested_id:
        last_message = db.query(ChatMessage).filter(ChatMessage.id == requested_id).first()
        if not last_message:
            raise HTTPException(status_code=404, detail="Message not found")
    else:
        last_message = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).first()

    state = _get_read_state(db, current_user.id)
    if not state:
        state = ChatReadState(user_id=current_user.id)
        db.add(state)

    if last_message:
        state.last_read_message_id = last_message.id
        state.last_read_at = last_message.created_at
    else:
        state.last_read_message_id = None
        state.last_read_at = datetime.utcnow()

    db.add(state)
    db.commit()
    db.refresh(state)

    response = ChatUnreadResponse(
        unread_count=_calculate_unread_count(db, current_user, state),
        last_read_message_id=state.last_read_message_id,
        last_read_at=state.last_read_at,
    )
    await realtime_manager.send_to_user(
        current_user.id,
        {
            "type": "unread_updated",
            "unread_count": response.unread_count,
            "last_read_message_id": str(response.last_read_message_id) if response.last_read_message_id else None,
            "last_read_at": response.last_read_at.isoformat() if response.last_read_at else None,
        },
    )
    return response


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, token: str | None = Query(default=None)):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = SessionLocal()
    current_user: User | None = None
    try:
        current_user = db.query(User).filter(User.email == payload["sub"]).first()
        if not current_user or not current_user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await realtime_manager.connect(websocket, current_user.id)

        users = db.query(User).filter(User.is_active.is_(True), User.role != "bot").order_by(User.full_name.asc()).all()
        await websocket.send_json(
            {
                "type": "presence_snapshot",
                "users": jsonable_encoder([build_member_response(user, current_user.id) for user in users]),
            }
        )

        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if event_type == "watching_update":
                media_id = str(data.get("media_id") or "").strip() or None
                title = str(data.get("title") or "").strip() or None
                if title and len(title) > 180:
                    title = title[:180]
                await realtime_manager.update_watching(current_user.id, media_id, title)
                continue

            if event_type == "watching_clear":
                await realtime_manager.update_watching(current_user.id, None, None)
                continue

            await websocket.send_json({"type": "error", "detail": "Unknown realtime event"})

    except WebSocketDisconnect:
        pass
    finally:
        db.close()
        if current_user:
            try:
                await realtime_manager.disconnect(websocket, current_user.id)
            except Exception:
                pass


@router.get("/mentions/me", response_model=list[ChatMessageResponse])
def list_my_mentions(
    limit: int = Query(default=50, ge=1, le=100),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(ChatMessage)
        .join(ChatMention, ChatMention.message_id == ChatMessage.id)
        .join(User, User.id == ChatMessage.author_id)
        .filter(ChatMention.mentioned_user_id == current_user.id, User.role != "bot")
    )

    if unread_only:
        state = _get_read_state(db, current_user.id)
        if state and state.last_read_at:
            query = query.filter(ChatMessage.created_at > state.last_read_at)

    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    messages = list(reversed(messages))
    authors = _get_author_map(db, messages)
    mentions = _get_mentions_map(db, messages)

    return [
        build_message_response(message, authors[message.author_id], mentions.get(message.id, []), db=db)
        for message in messages
        if message.author_id in authors
    ]
