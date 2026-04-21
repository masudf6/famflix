import mimetypes
import os
import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def build_media_key(media_type: str, filename: str) -> str:
    safe_name = os.path.basename(filename)
    extension = os.path.splitext(safe_name)[1].lower()
    return f"{media_type}/{uuid.uuid4()}{extension}"


def generate_presigned_upload_url(
    key: str,
    content_type: str,
) -> str:
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.AWS_S3_BUCKET,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRE_SECONDS,
        HttpMethod="PUT",
    )


def generate_presigned_download_url(key: str) -> str:
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.AWS_S3_BUCKET,
            "Key": key,
        },
        ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRE_SECONDS,
        HttpMethod="GET",
    )


def generate_presigned_stream_url(key: str, content_type: str | None = None) -> str:
    s3 = get_s3_client()
    response_content_type = content_type or mimetypes.guess_type(key)[0] or "application/octet-stream"

    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.AWS_S3_BUCKET,
            "Key": key,
            "ResponseContentType": response_content_type,
        },
        ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRE_SECONDS,
        HttpMethod="GET",
    )

def s3_object_exists(key: str) -> bool:
    s3 = get_s3_client()
    try:
        s3.head_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except ClientError:
        return False