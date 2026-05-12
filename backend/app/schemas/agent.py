from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.chat import ChatMessageResponse
from app.schemas.media import MediaResponse


class AgentChatRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    # Optional ID of the saved chat message that triggered Fam.
    # This lets the backend build accurate room history/context.
    source_message_id: Optional[UUID] = None


class AgentChatResponse(BaseModel):
    answer: str
    media_ids: list[UUID] = Field(default_factory=list)
    media_items: list[MediaResponse] = Field(default_factory=list)
    message: Optional[ChatMessageResponse] = None
