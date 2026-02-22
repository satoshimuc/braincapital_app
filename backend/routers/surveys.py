from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

from database import get_db
import models
from auth import get_current_user
from scoring import (
    calculate_pillar1_score, calculate_pillar2_score, calculate_pillar3_score,
    total_score, get_benchmark
)

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


class SurveySubmitRequest(BaseModel):
    survey_type: str  # baseline, weekly, monthly
    pillar: str       # drivers, health, skills
    responses: Dict[str, float]


class SurveyBatchRequest(BaseModel):
    survey_type: str
    drivers: Optional[Dict[str, float]] = None
    health: Optional[Dict[str, float]] = None
    skills_survey: Optional[Dict[str, float]] = None


class ScoreResponse(BaseModel):
    pillar1_score: Optional[float]
    pillar2_score: Optional[float]
    pillar3_score: Optional[float]
    total_score: Optional[float]
    benchmark: Dict[str, float]
    date: str


@router.post("/submit")
def submit_survey(
    req: SurveySubmitRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for item_id, score in req.responses.items():
        response = models.SurveyResponse(
            user_id=current_user.id,
            survey_type=req.survey_type,
            pillar=req.pillar,
            item_id=item_id,
            score=score
        )
        db.add(response)
    db.commit()
    return {"message": "保存しました"}


@router.post("/submit-batch", response_model=ScoreResponse)
def submit_batch(
    req: SurveyBatchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Save all survey responses
    for pillar_key, pillar_name in [
        ("drivers", "drivers"),
        ("health", "health"),
        ("skills_survey", "skills")
    ]:
        pillar_data = getattr(req, pillar_key, None)
        if pillar_data:
            for item_id, score in pillar_data.items():
                response = models.SurveyResponse(
                    user_id=current_user.id,
                    survey_type=req.survey_type,
                    pillar=pillar_name,
                    item_id=item_id,
                    score=score,
                    timestamp=now
                )
                db.add(response)

    # Calculate scores
    p1 = calculate_pillar1_score(req.drivers or {}) if req.drivers else None
    p2 = calculate_pillar2_score(req.health or {}) if req.health else None
    p3 = None
    if req.skills_survey:
        p3 = calculate_pillar3_score(req.skills_survey, {})

    # For weekly: only drivers, keep previous health/skills
    if req.survey_type == "weekly":
        last_score = (
            db.query(models.Score)
            .filter(models.Score.user_id == current_user.id)
            .order_by(models.Score.date.desc())
            .first()
        )
        if last_score:
            if p2 is None:
                p2 = last_score.pillar2_score
            if p3 is None:
                p3 = last_score.pillar3_score

    t_score = None
    if p1 is not None and p2 is not None and p3 is not None:
        t_score = total_score(p1, p2, p3)

    # Save score record
    score_record = models.Score(
        user_id=current_user.id,
        date=now,
        survey_type=req.survey_type,
        pillar1_score=p1,
        pillar2_score=p2,
        pillar3_score=p3,
        total_score=t_score
    )
    db.add(score_record)
    db.commit()

    benchmark = get_benchmark(current_user.age)
    return ScoreResponse(
        pillar1_score=p1,
        pillar2_score=p2,
        pillar3_score=p3,
        total_score=t_score,
        benchmark=benchmark,
        date=now.isoformat()
    )


@router.get("/history")
def get_history(
    limit: int = 12,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scores = (
        db.query(models.Score)
        .filter(models.Score.user_id == current_user.id)
        .order_by(models.Score.date.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "date": s.date.isoformat(),
            "survey_type": s.survey_type,
            "pillar1_score": s.pillar1_score,
            "pillar2_score": s.pillar2_score,
            "pillar3_score": s.pillar3_score,
            "total_score": s.total_score,
        }
        for s in reversed(scores)
    ]


@router.get("/latest")
def get_latest(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    score = (
        db.query(models.Score)
        .filter(models.Score.user_id == current_user.id)
        .order_by(models.Score.date.desc())
        .first()
    )
    if not score:
        return None
    benchmark = get_benchmark(current_user.age)
    return {
        "id": score.id,
        "date": score.date.isoformat(),
        "survey_type": score.survey_type,
        "pillar1_score": score.pillar1_score,
        "pillar2_score": score.pillar2_score,
        "pillar3_score": score.pillar3_score,
        "total_score": score.total_score,
        "benchmark": benchmark,
    }


@router.get("/has-baseline")
def has_baseline(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exists = (
        db.query(models.Score)
        .filter(
            models.Score.user_id == current_user.id,
            models.Score.survey_type == "baseline"
        )
        .first()
    )
    return {"has_baseline": exists is not None}
