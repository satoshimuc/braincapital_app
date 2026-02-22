from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from database import get_db
import models
from auth import (
    verify_password, get_password_hash, create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    age: Optional[int] = None
    gender: Optional[str] = None
    language: str = "ja"
    consent_given: bool = False


class GuestRequest(BaseModel):
    language: str = "ja"


class UserResponse(BaseModel):
    id: int
    email: str
    is_guest: bool
    age: Optional[int]
    gender: Optional[str]
    language: str
    consent_given: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.consent_given:
        raise HTTPException(status_code=400, detail="同意が必要です / Consent required")

    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="このメールは既に登録されています")

    user = models.User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        is_guest=False,
        age=req.age,
        gender=req.gender,
        language=req.language,
        consent_given=req.consent_given,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**{
            "id": user.id,
            "email": user.email,
            "is_guest": user.is_guest,
            "age": user.age,
            "gender": user.gender,
            "language": user.language,
            "consent_given": user.consent_given,
        })
    )


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not user.hashed_password or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません"
        )
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**{
            "id": user.id,
            "email": user.email,
            "is_guest": user.is_guest,
            "age": user.age,
            "gender": user.gender,
            "language": user.language,
            "consent_given": user.consent_given,
        })
    )


@router.post("/guest", response_model=TokenResponse)
def guest_login(req: GuestRequest, db: Session = Depends(get_db)):
    guest_email = f"guest_{uuid.uuid4().hex[:8]}@pbcm.local"
    user = models.User(
        email=guest_email,
        hashed_password=None,
        is_guest=True,
        language=req.language,
        consent_given=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**{
            "id": user.id,
            "email": user.email,
            "is_guest": user.is_guest,
            "age": user.age,
            "gender": user.gender,
            "language": user.language,
            "consent_given": user.consent_given,
        })
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return UserResponse(**{
        "id": current_user.id,
        "email": current_user.email,
        "is_guest": current_user.is_guest,
        "age": current_user.age,
        "gender": current_user.gender,
        "language": current_user.language,
        "consent_given": current_user.consent_given,
    })


@router.put("/profile")
def update_profile(
    age: Optional[int] = None,
    gender: Optional[str] = None,
    language: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if age is not None:
        current_user.age = age
    if gender is not None:
        current_user.gender = gender
    if language is not None:
        current_user.language = language
    db.commit()
    return {"message": "プロフィールを更新しました"}
