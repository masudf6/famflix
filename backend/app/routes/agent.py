import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.services.agent_service import run_agent
from app.services.fam_bot_service import get_or_create_fam_bot
from app.services.realtime import realtime_manager
from app.routes.chat import build_message_response, _broadcast_unread_counts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


def _valid_uuid_strings(raw_ids: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw_id in raw_ids or []:
        try:
            value = str(UUID(str(raw_id)))
        except (TypeError, ValueError):
            continue
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_fam_agent(
    payload: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = run_agent(
            db=db,
            user_query=payload.text,
            current_user=current_user,
            source_message_id=payload.source_message_id,
        )
        answer = str(result.get("answer") or "I could not answer that.").strip()
        media_ids = _valid_uuid_strings(result.get("media_ids") or [])

        fam_bot = get_or_create_fam_bot(db)
        message = ChatMessage(
            author_id=fam_bot.id,
            text=answer,
            media_ids=media_ids,
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        message_response = build_message_response(
            message=message,
            author=fam_bot,
            mentions=[],
            db=db,
        )

        await realtime_manager.broadcast(
            {
                "type": "message_created",
                "message": jsonable_encoder(message_response),
            }
        )

        active_users = db.query(User).filter(User.is_active.is_(True), User.role != "bot").all()
        await _broadcast_unread_counts(db, active_users)

        return AgentChatResponse(
            answer=answer,
            media_ids=message_response.media_ids,
            media_items=message_response.media_items,
            message=message_response,
        )
    except Exception:
        logger.exception("Fam agent failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fam assistant is unavailable right now.",
        )
