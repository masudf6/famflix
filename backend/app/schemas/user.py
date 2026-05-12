from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=100)


class UserPreferencesUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=100)


class UserPreferencesResponse(BaseModel):
    display_name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    display_name: Optional[str] = None
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
