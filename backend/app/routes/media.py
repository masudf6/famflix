from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.dependencies import get_current_user, require_admin
from app.models.media import Media
from app.models.media_file import MediaFile
from app.models.user import User
from app.schemas.media import (
    AccessLinkResponse,
    MediaCreate,
    MediaFileResponse,
    MediaResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.services.metadata_agent_service import enrich_media_metadata, upload_thumbnail_from_url
from app.services.s3_service import (
    build_media_key,
    delete_s3_object,
    generate_presigned_download_url,
    generate_presigned_stream_url,
    generate_presigned_upload_url,
    s3_object_exists,
)

router = APIRouter(tags=["media"])

SortBy = Literal["created_at", "title", "release_year", "rating"]
SortDir = Literal["asc", "desc"]


def _normalise_string_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    seen: set[str] = set()
    cleaned: list[str] = []
    for value in values:
        item = value.strip()
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
    return cleaned


def get_media_or_404(media_id: UUID, db: Session) -> Media:
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


def build_media_response(media: Media, media_file: MediaFile | None) -> MediaResponse:
    return MediaResponse(
        id=media.id,
        title=media.title,
        description=media.description,
        media_type=media.media_type,
        thumbnail_url=media.thumbnail_url,
        thumbnail_s3_key=media.thumbnail_s3_key,
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


def _matches_metadata_filter(media: Media, genre: str | None, tag: str | None) -> bool:
    if genre:
        wanted = genre.strip().lower()
        genres = [g.lower() for g in (media.genres or [])]
        if wanted not in genres:
            return False
    if tag:
        wanted = tag.strip().lower()
        tags = [t.lower() for t in (media.tags or [])]
        if wanted not in tags:
            return False
    return True


@router.get(
    "/media/me",
    deprecated=True,
    summary="DEPRECATED — use GET /auth/me",
)
def read_my_access_deprecated(current_user: User = Depends(get_current_user)):
    """
    Deprecated: use GET /auth/me instead. Kept temporarily so old clients
    don't break during deploy.
    """
    return {
        "message": "Authenticated successfully",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "display_name": current_user.display_name,
            "role": current_user.role,
            "created_at": current_user.created_at,
        },
    }


@router.get("/media", response_model=list[MediaResponse])
def list_media(
    q: str | None = Query(default=None, description="Search title and description"),
    media_type: str | None = Query(default=None, description="movie, series, video, audio, etc."),
    genre: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    sort_by: SortBy = Query(default="created_at"),
    sort_dir: SortDir = Query(default="desc"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Media)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(or_(Media.title.ilike(search), Media.description.ilike(search)))

    if media_type and media_type.strip():
        query = query.filter(Media.media_type == media_type.strip().lower())

    sort_column = {
        "created_at": Media.created_at,
        "title": Media.title,
        "release_year": Media.release_year,
        "rating": Media.rating,
    }[sort_by]
    order = asc(sort_column) if sort_dir == "asc" else desc(sort_column)
    query = query.order_by(order, desc(Media.created_at))

    media_items = query.all()
    media_items = [m for m in media_items if _matches_metadata_filter(m, genre, tag)]
    media_items = media_items[offset : offset + limit]

    response = []
    for media in media_items:
        media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
        response.append(build_media_response(media, media_file))

    return response


@router.get("/media/{media_id}", response_model=MediaResponse)
def get_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    media = get_media_or_404(media_id, db)
    media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
    return build_media_response(media, media_file)


@router.post(
    "/admin/media/upload-url",
    response_model=UploadUrlResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_upload_url(
    payload: UploadUrlRequest,
    admin_user: User = Depends(require_admin),
):
    key = build_media_key(payload.media_type, payload.filename)
    upload_url = generate_presigned_upload_url(
        key=key,
        content_type=payload.content_type,
    )

    return {
        "key": key,
        "upload_url": upload_url,
        "expires_in": settings.S3_PRESIGNED_URL_EXPIRE_SECONDS,
    }


@router.post(
    "/admin/media",
    response_model=MediaResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_media(
    payload: MediaCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if not s3_object_exists(payload.file.s3_key):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file was not found in S3. Upload the file first, then save metadata.",
        )

    media_type = payload.media_type.strip().lower()
    enrichment = enrich_media_metadata(
        title=payload.title.strip(),
        media_type=media_type,
        release_year=payload.release_year,
    )

    genres = _normalise_string_list(payload.genres) or _normalise_string_list(enrichment.get("genres"))
    tags = _normalise_string_list([*(payload.tags or []), *(enrichment.get("tags") or [])])

    media = Media(
        title=payload.title.strip(),
        description=payload.description or enrichment.get("description"),
        media_type=media_type,
        thumbnail_url=payload.thumbnail_url or enrichment.get("thumbnail_url"),
        uploaded_by=admin_user.id,
        # All media is available to every authenticated user.
        is_public=True,
        release_year=payload.release_year or enrichment.get("release_year"),
        rating=(payload.rating.strip() if payload.rating else None) or enrichment.get("rating"),
        audience_rating=(payload.audience_rating.strip() if payload.audience_rating else None) or enrichment.get("audience_rating"),
        genres=genres,
        tags=tags,
    )

    db.add(media)
    db.flush()

    if not payload.thumbnail_url and enrichment.get("thumbnail_url"):
        media.thumbnail_s3_key = upload_thumbnail_from_url(
            media_id=str(media.id),
            thumbnail_url=enrichment.get("thumbnail_url"),
        )

    media_file = MediaFile(
        media_id=media.id,
        s3_key=payload.file.s3_key,
        original_filename=payload.file.original_filename,
        content_type=payload.file.content_type,
        file_size_bytes=payload.file.file_size_bytes,
        duration_seconds=payload.file.duration_seconds,
    )

    db.add(media_file)
    db.commit()
    db.refresh(media)
    db.refresh(media_file)

    return build_media_response(media, media_file)


@router.delete("/admin/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin_user: User = Depends(require_admin),
):
    """Delete a media item and its stored file. Admin only."""
    media = get_media_or_404(media_id, db)
    media_files = db.query(MediaFile).filter(MediaFile.media_id == media.id).all()

    # Delete S3 objects first. S3 delete is idempotent for missing keys.
    for media_file in media_files:
        delete_s3_object(media_file.s3_key)

    if media.thumbnail_s3_key:
        delete_s3_object(media.thumbnail_s3_key)

    # Delete child rows explicitly so this also behaves well in local SQLite/dev.
    for media_file in media_files:
        db.delete(media_file)

    db.delete(media)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/media/{media_id}/stream", response_model=AccessLinkResponse)
def stream_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    media = get_media_or_404(media_id, db)

    media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    url = generate_presigned_stream_url(
        key=media_file.s3_key,
        content_type=media_file.content_type,
    )

    return {
        "media_id": media.id,
        "action": "stream",
        "url": url,
    }


@router.get("/media/{media_id}/download", response_model=AccessLinkResponse)
def download_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    media = get_media_or_404(media_id, db)

    media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    url = generate_presigned_download_url(media_file.s3_key)

    return {
        "media_id": media.id,
        "action": "download",
        "url": url,
    }
