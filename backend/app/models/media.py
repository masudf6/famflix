import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.db import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    media_type = Column(String(20), nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    thumbnail_s3_key = Column(Text, nullable=True)
    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_public = Column(Boolean, nullable=False, default=True)

    # Optional catalogue metadata used by the frontend cards/details and future recommendations.
    release_year = Column(Integer, nullable=True)
    rating = Column(String(20), nullable=True)
    audience_rating = Column(String(50), nullable=True)
    genres = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
