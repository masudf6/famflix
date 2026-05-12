from typing import Any

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.media import Media
from app.models.media_file import MediaFile


MAX_CATALOG_LIMIT = 300


def get_media_catalog(db: Session, limit: int = 100) -> dict[str, Any]:
    """
    Simple DB tool for the FamFlix agent.

    This tool does not search, rank, score, or recommend.
    It only converts DB rows into plain JSON-friendly data so the LLM can decide
    which media items are relevant to the user's query.
    """

    safe_limit = max(1, min(int(limit or 100), MAX_CATALOG_LIMIT))

    media_items = (
        db.query(Media)
        .filter(Media.is_public.is_(True))
        .order_by(desc(Media.created_at))
        .limit(safe_limit)
        .all()
    )

    media_ids = [media.id for media in media_items]
    files_by_media_id: dict[Any, MediaFile] = {}

    if media_ids:
        media_files = db.query(MediaFile).filter(MediaFile.media_id.in_(media_ids)).all()
        files_by_media_id = {media_file.media_id: media_file for media_file in media_files}

    items: list[dict[str, Any]] = []

    for media in media_items:
        media_file = files_by_media_id.get(media.id)

        items.append(
            {
                "id": str(media.id),
                "title": media.title,
                "description": media.description,
                "media_type": media.media_type,
                "thumbnail_url": media.thumbnail_url,
                "uploaded_by": str(media.uploaded_by) if media.uploaded_by else None,
                "is_public": media.is_public,
                "release_year": media.release_year,
                "rating": media.rating,
                "audience_rating": media.audience_rating,
                "genres": media.genres or [],
                "tags": media.tags or [],
                "created_at": str(media.created_at) if media.created_at else None,
                # Frontend-friendly links that the assistant can put in chat.
                "media_url": f"/media/{media.id}",
                # Backend API links. These return signed S3 URLs when called by the app.
                "stream_url": f"/media/{media.id}/stream",
                "download_url": f"/media/{media.id}/download",
                "file": {
                    "id": str(media_file.id),
                    "media_id": str(media_file.media_id),
                    "s3_key": media_file.s3_key,
                    "original_filename": media_file.original_filename,
                    "content_type": media_file.content_type,
                    "file_size_bytes": media_file.file_size_bytes,
                    "duration_seconds": media_file.duration_seconds,
                    "created_at": str(media_file.created_at) if media_file.created_at else None,
                }
                if media_file
                else None,
            }
        )

    return {
        "source": "famflix_db",
        "count": len(items),
        "items": items,
    }
