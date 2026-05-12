from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


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
    release_year: Optional[int] = Field(default=None, ge=1888, le=2100)
    rating: Optional[str] = Field(default=None, max_length=20)
    audience_rating: Optional[str] = Field(default=None, max_length=50)
    genres: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
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
    thumbnail_s3_key: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    is_public: bool
    release_year: Optional[int] = None
    rating: Optional[str] = None
    audience_rating: Optional[str] = None
    genres: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
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
