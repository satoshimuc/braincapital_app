from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
import models
from auth import get_current_user
from scoring import (
    normalize_test_score_attention,
    normalize_test_score_memory,
    normalize_test_score_flexibility,
    calculate_pillar3_score
)

router = APIRouter(prefix="/api/tests", tags=["tests"])


class AttentionTestResult(BaseModel):
    avg_reaction_ms: float
    correct_rate: float  # 0.0 - 1.0
    total_trials: int


class MemoryTestResult(BaseModel):
    correct_count: int
    total_trials: int


class FlexibilityTestResult(BaseModel):
    avg_reaction_ms: float
    correct_rate: float
    total_trials: int


class CognitiveTestBatch(BaseModel):
    attention: Optional[AttentionTestResult] = None
    memory: Optional[MemoryTestResult] = None
    flexibility: Optional[FlexibilityTestResult] = None
    skills_survey: Optional[dict] = None  # combined with survey scores


class TestScoreResponse(BaseModel):
    attention_score: Optional[float]
    memory_score: Optional[float]
    flexibility_score: Optional[float]
    pillar3_score: float


@router.post("/submit", response_model=TestScoreResponse)
def submit_tests(
    req: CognitiveTestBatch,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    test_results = {}

    if req.attention:
        score = normalize_test_score_attention(
            req.attention.avg_reaction_ms, req.attention.correct_rate
        )
        db.add(models.TestResult(
            user_id=current_user.id,
            timestamp=now,
            test_type="attention",
            raw_score=req.attention.avg_reaction_ms,
            normalized_score=score
        ))
        test_results["attention"] = score

    if req.memory:
        score = normalize_test_score_memory(
            req.memory.correct_count, req.memory.total_trials
        )
        db.add(models.TestResult(
            user_id=current_user.id,
            timestamp=now,
            test_type="memory",
            raw_score=req.memory.correct_count,
            normalized_score=score
        ))
        test_results["memory"] = score

    if req.flexibility:
        score = normalize_test_score_flexibility(
            req.flexibility.avg_reaction_ms, req.flexibility.correct_rate
        )
        db.add(models.TestResult(
            user_id=current_user.id,
            timestamp=now,
            test_type="flexibility",
            raw_score=req.flexibility.avg_reaction_ms,
            normalized_score=score
        ))
        test_results["flexibility"] = score

    db.commit()

    p3 = calculate_pillar3_score(req.skills_survey or {}, test_results)

    return TestScoreResponse(
        attention_score=test_results.get("attention"),
        memory_score=test_results.get("memory"),
        flexibility_score=test_results.get("flexibility"),
        pillar3_score=p3
    )


@router.get("/history")
def get_test_history(
    limit: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = (
        db.query(models.TestResult)
        .filter(models.TestResult.user_id == current_user.id)
        .order_by(models.TestResult.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "test_type": r.test_type,
            "raw_score": r.raw_score,
            "normalized_score": r.normalized_score,
        }
        for r in results
    ]
