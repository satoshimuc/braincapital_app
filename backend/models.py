from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for guest
    is_guest = Column(Boolean, default=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    language = Column(String, default="ja")
    consent_given = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    survey_responses = relationship("SurveyResponse", back_populates="user")
    test_results = relationship("TestResult", back_populates="user")
    scores = relationship("Score", back_populates="user")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    survey_type = Column(String, nullable=False)  # baseline, weekly, monthly
    pillar = Column(String, nullable=False)  # drivers, health, skills
    item_id = Column(String, nullable=False)
    score = Column(Float, nullable=False)

    user = relationship("User", back_populates="survey_responses")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    test_type = Column(String, nullable=False)  # attention, memory, flexibility
    raw_score = Column(Float, nullable=False)
    normalized_score = Column(Float, nullable=False)

    user = relationship("User", back_populates="test_results")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    survey_type = Column(String, nullable=False)  # baseline, weekly, monthly
    pillar1_score = Column(Float, nullable=True)
    pillar2_score = Column(Float, nullable=True)
    pillar3_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)

    user = relationship("User", back_populates="scores")
