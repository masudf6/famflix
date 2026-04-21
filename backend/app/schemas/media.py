from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class MediaFileCreate(BaseModel):
    s3_key: str
    original_filename: str
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[int] = None


class MediaCreate(BaseModel):
    title: str
    description: Optional[str] = None
    media_type: str
    thumbnail_url: Optional[str] = None
    is_public: bool = True
    file: MediaFileCreate


class MediaFileResponse(BaseModel):
    id: UUID
    s3_key: str
    original_filename: str
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MediaResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    media_type: str
    thumbnail_url: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    is_public: bool
    created_at: datetime
    file: Optional[MediaFileResponse] = None

    model_config = {"from_attributes": True}


class AccessLinkResponse(BaseModel):
    media_id: UUID
    action: str
    url: str


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    media_type: str


class UploadUrlResponse(BaseModel):
    key: str
    upload_url: str
    expires_in: int