from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.services.s3_service import (
    build_media_key,
    generate_presigned_download_url,
    generate_presigned_stream_url,
    generate_presigned_upload_url,
    s3_object_exists,
)

router = APIRouter(tags=["media"])


def build_media_response(media: Media, media_file: MediaFile | None) -> MediaResponse:
    return MediaResponse(
        id=media.id,
        title=media.title,
        description=media.description,
        media_type=media.media_type,
        thumbnail_url=media.thumbnail_url,
        uploaded_by=media.uploaded_by,
        is_public=media.is_public,
        created_at=media.created_at,
        file=MediaFileResponse.model_validate(media_file) if media_file else None,
    )


@router.get("/media/me")
def read_my_access(current_user: User = Depends(get_current_user)):
    return {
        "message": "Authenticated successfully",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "role": current_user.role,
        },
    }


@router.get("/media", response_model=list[MediaResponse])
def list_media(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media_items = db.query(Media).order_by(Media.created_at.desc()).all()

    response = []
    for media in media_items:
        media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
        response.append(build_media_response(media, media_file))

    return response


@router.get("/media/{media_id}", response_model=MediaResponse)
def get_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

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
    media = Media(
        title=payload.title,
        description=payload.description,
        media_type=payload.media_type,
        thumbnail_url=payload.thumbnail_url,
        uploaded_by=admin_user.id,
        is_public=payload.is_public,
    )
    db.add(media)
    db.flush()

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

    if not s3_object_exists(payload.file.s3_key):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file was not found in S3. Upload the file first, then save metadata.",
        )

    return build_media_response(media, media_file)


@router.get("/media/{media_id}/stream", response_model=AccessLinkResponse)
def stream_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

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
    current_user: User = Depends(get_current_user),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    media_file = db.query(MediaFile).filter(MediaFile.media_id == media.id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    url = generate_presigned_download_url(media_file.s3_key)

    return {
        "media_id": media.id,
        "action": "download",
        "url": url,
    }