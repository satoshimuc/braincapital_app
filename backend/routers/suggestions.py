from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
import models
from auth import get_current_user
from suggestions_data import get_all_suggestions

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("/")
def get_suggestions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest_score = (
        db.query(models.Score)
        .filter(models.Score.user_id == current_user.id)
        .order_by(models.Score.date.desc())
        .first()
    )
    if not latest_score:
        return []

    lang = current_user.language or "ja"
    suggestions = get_all_suggestions(
        drivers=latest_score.pillar1_score or 50,
        health=latest_score.pillar2_score or 50,
        skills=latest_score.pillar3_score or 50,
        lang=lang
    )
    return suggestions
