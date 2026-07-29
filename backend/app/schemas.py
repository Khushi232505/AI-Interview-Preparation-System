"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    target_role: Optional[str] = None
    experience_years: Optional[int] = 0

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    target_role: Optional[str]
    experience_years: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Resume Schemas ───────────────────────────────────────────────────────────

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_url: str
    original_filename: Optional[str]
    parsed_skills: Optional[Dict[str, Any]]
    job_match_score: float
    target_role: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeAnalysis(BaseModel):
    resume_id: str
    skills: List[str]
    experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    job_match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str


# ─── Interview Schemas ────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    resume_id: Optional[str] = None
    target_role: str
    session_type: str = "mixed"   # technical, behavioral, mixed
    num_questions: int = 5


class InterviewSessionResponse(BaseModel):
    id: str
    user_id: str
    target_role: Optional[str]
    session_type: str
    status: str
    total_score: float
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class QuestionResponse(BaseModel):
    id: str
    question_text: str
    question_type: str
    difficulty: str
    order_index: int

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: str
    transcript: str
    duration_secs: Optional[int] = 0
    wpm: Optional[float] = 0.0
    filler_word_count: Optional[int] = 0
    confidence_score: Optional[float] = 50.0


class ScoreResponse(BaseModel):
    id: str
    technical_accuracy: float
    communication: float
    confidence: float
    relevance: float
    overall_score: float
    llm_feedback: Optional[str]
    improvement_tips: Optional[List[Dict[str, Any]]]

    class Config:
        from_attributes = True


class SessionResultsResponse(BaseModel):
    session: InterviewSessionResponse
    questions: List[QuestionResponse]
    scores: List[ScoreResponse]
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    skill_gaps: List[str]


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_sessions: int
    avg_score: float
    best_score: float
    sessions_this_week: int
    top_skill: Optional[str]
    skill_radar: Dict[str, float]
    score_history: List[Dict[str, Any]]
    filler_word_trend: List[Dict[str, Any]]
    recent_sessions: List[InterviewSessionResponse]
