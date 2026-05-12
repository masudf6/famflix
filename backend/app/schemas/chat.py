from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.media import MediaResponse


class ChatMemberResponse(BaseModel):
    id: UUID
    name: str
    handle: str
    online: bool = False
    is_current_user: bool = False
    is_bot: bool = False
    watching_media_id: Optional[str] = None
    watching_title: Optional[str] = None


class ChatMessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class ChatReadUpdate(BaseModel):
    last_read_message_id: Optional[UUID] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    author_id: UUID
    author_name: str
    author_handle: str
    text: str
    created_at: datetime
    mentioned_user_ids: list[UUID] = Field(default_factory=list)
    mentioned_handles: list[str] = Field(default_factory=list)
    media_ids: list[UUID] = Field(default_factory=list)
    media_items: list[MediaResponse] = Field(default_factory=list)


class ChatUnreadResponse(BaseModel):
    unread_count: int
    last_read_message_id: Optional[UUID] = None
    last_read_at: Optional[datetime] = None
