import logging
import os
import re
import uuid
from typing import Any

import requests

from app.services.s3_service import upload_bytes_to_s3

logger = logging.getLogger(__name__)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280"



def _clean_title(title: str) -> str:
    value = re.sub(r"\.[a-zA-Z0-9]{2,5}$", "", title or "")
    value = re.sub(r"[._-]+", " ", value)
    value = re.sub(r"\b(720p|1080p|2160p|4k|x264|x265|bluray|webrip|web|hdtv)\b", " ", value, flags=re.I)
    return " ".join(value.split()).strip()


def _normalise_title(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _tmdb_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    if not TMDB_API_KEY:
        logger.warning("TMDB_API_KEY is missing inside backend process")
        return {}

    headers = {"accept": "application/json"}
    params = dict(params or {})
    params["api_key"] = TMDB_API_KEY

    response = requests.get(
        f"{TMDB_BASE_URL}{path}",
        params=params,
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def _year_from_date(value: str | None) -> int | None:
    if not value or len(value) < 4:
        return None
    try:
        return int(value[:4])
    except ValueError:
        return None


def _pick_best_result(
    results: list[dict[str, Any]],
    title: str,
    media_type: str,
    release_year: int | None,
) -> dict[str, Any] | None:
    wanted_title = _normalise_title(title)

    def score(item: dict[str, Any]) -> tuple[int, float]:
        item_title = item.get("title") or item.get("name") or ""
        item_year = _year_from_date(item.get("release_date") or item.get("first_air_date"))

        value = 0
        if item.get("media_type") and item.get("media_type") != media_type:
            value -= 20
        if _normalise_title(item_title) == wanted_title:
            value += 50
        elif wanted_title and wanted_title in _normalise_title(item_title):
            value += 25
        if release_year and item_year == release_year:
            value += 30
        if item.get("poster_path"):
            value += 10
        if item.get("overview"):
            value += 5

        return value, float(item.get("popularity") or 0)

    filtered = [item for item in results if item.get("media_type") in {media_type, None}]
    if not filtered:
        filtered = results

    return max(filtered, key=score, default=None)


def _movie_certification(details: dict[str, Any]) -> str | None:
    results = ((details.get("release_dates") or {}).get("results") or [])
    preferred = next((item for item in results if item.get("iso_3166_1") == "US"), None)
    preferred = preferred or next((item for item in results if item.get("release_dates")), None)
    if not preferred:
        return None
    for release in preferred.get("release_dates") or []:
        certification = (release.get("certification") or "").strip()
        if certification:
            return certification
    return None


def _tv_certification(details: dict[str, Any]) -> str | None:
    results = ((details.get("content_ratings") or {}).get("results") or [])
    preferred = next((item for item in results if item.get("iso_3166_1") == "US"), None)
    preferred = preferred or next((item for item in results if item.get("rating")), None)
    rating = (preferred or {}).get("rating") if preferred else None
    return rating or None


def _build_metadata(media_type: str, details: dict[str, Any]) -> dict[str, Any]:
    title = details.get("title") or details.get("name")
    overview = details.get("overview")

    # Horizontal landscape image
    backdrop_path = details.get("backdrop_path")

    release_year = _year_from_date(
        details.get("release_date") or details.get("first_air_date")
    )

    genres = [
        genre.get("name")
        for genre in details.get("genres") or []
        if genre.get("name")
    ]

    vote_average = details.get("vote_average")
    tmdb_id = details.get("id")

    if media_type == "movie":
        rating = _movie_certification(details)
    else:
        rating = _tv_certification(details)

    return {
        "title": title,
        "description": overview,

        # Use horizontal image only
        "thumbnail_url": f"{TMDB_IMAGE_BASE_URL}{backdrop_path}" if backdrop_path else None,

        "release_year": release_year,
        "rating": rating,
        "audience_rating": (
            f"TMDb {float(vote_average):.1f}/10"
            if isinstance(vote_average, (int, float))
            else None
        ),
        "genres": genres,
        "tags": [
            tag
            for tag in ["tmdb", media_type, f"tmdb:{tmdb_id}" if tmdb_id else None]
            if tag
        ],
    }


def enrich_media_metadata(
    title: str,
    media_type: str,
    release_year: int | None = None,
) -> dict[str, Any]:
    if not TMDB_API_KEY:
        logger.warning("TMDB_API_KEY is not configured; skipping metadata enrichment")
        return {}

    clean_title = _clean_title(title)
    clean_media_type = (media_type or "").strip().lower()

    # Treat uploaded videos as movies by default
    if clean_media_type in {"movie", "film", "video"}:
        tmdb_type = "movie"
    elif clean_media_type in {"series", "tv", "show", "tv_show"}:
        tmdb_type = "tv"
    else:
        logger.info("Skipping TMDb enrichment for unsupported media_type=%s", media_type)
        return {}

    try:
        search = _tmdb_get(
            f"/search/{tmdb_type}",
            {
                "query": clean_title,
                "include_adult": "false",
                "language": "en-US",
                "page": 1,
                **({"year": release_year} if tmdb_type == "movie" and release_year else {}),
                **({"first_air_date_year": release_year} if tmdb_type == "tv" and release_year else {}),
            },
        )

        results = search.get("results") or []

        logger.info(
            "TMDb search title=%s media_type=%s tmdb_type=%s results=%s",
            clean_title,
            media_type,
            tmdb_type,
            len(results),
        )

        best = _pick_best_result(results, clean_title, tmdb_type, release_year)

        if not best or not best.get("id"):
            logger.warning(
                "No TMDb match found title=%s media_type=%s tmdb_type=%s",
                clean_title,
                media_type,
                tmdb_type,
            )
            return {}

        details = _tmdb_get(
            f"/{tmdb_type}/{best['id']}",
            {
                "language": "en-US",
                "append_to_response": "release_dates" if tmdb_type == "movie" else "content_ratings",
            },
        )

        metadata = _build_metadata(tmdb_type, details)

        logger.info(
            "TMDb enrichment success title=%s matched_title=%s",
            clean_title,
            metadata.get("title"),
        )

        return metadata

    except Exception:
        logger.exception(
            "Metadata enrichment failed for title=%s media_type=%s",
            title,
            media_type,
        )
        return {}


def upload_thumbnail_from_url(media_id: str, thumbnail_url: str | None) -> str | None:
    """
    Downloads the poster image and uploads a copy to S3.
    Returns the S3 key. The app can still use the external thumbnail_url for display.
    """

    if not thumbnail_url:
        return None

    try:
        response = requests.get(thumbnail_url, timeout=15)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type") or "image/jpeg"
        extension = ".jpg"
        if "png" in content_type:
            extension = ".png"
        elif "webp" in content_type:
            extension = ".webp"

        key = f"thumbnails/{media_id}/{uuid.uuid4()}{extension}"
        upload_bytes_to_s3(
            key=key,
            body=response.content,
            content_type=content_type,
        )
        return key
    except Exception:
        logger.exception("Failed to upload thumbnail for media_id=%s", media_id)
        return None
