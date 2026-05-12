from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MeResponse
from app.schemas.user import UserPreferencesResponse, UserPreferencesUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _clean_display_name(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


@router.get("/me", response_model=MeResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return {"user": current_user}


@router.patch("/me", response_model=MeResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.display_name is not None:
        current_user.display_name = _clean_display_name(payload.display_name)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"user": current_user}


@router.get("/me/preferences", response_model=UserPreferencesResponse)
def get_my_preferences(current_user: User = Depends(get_current_user)):
    return {"display_name": current_user.display_name}


@router.patch("/me/preferences", response_model=UserPreferencesResponse)
def update_my_preferences(
    payload: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.display_name is not None:
        current_user.display_name = _clean_display_name(payload.display_name)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"display_name": current_user.display_name}
