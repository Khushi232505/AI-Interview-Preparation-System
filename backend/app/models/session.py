"""SQLAlchemy InterviewSession, Question, Answer, and Score models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    session_type = Column(String(50), default="mixed")   # technical, behavioral, mixed
    target_role = Column(String(100))
    status = Column(String(20), default="pending")       # pending, active, completed
    total_score = Column(Float, default=0.0)
    duration_mins = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    resume = relationship("Resume", back_populates="sessions")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="technical")  # technical, behavioral, coding, hr
    difficulty = Column(String(20), default="medium")         # easy, medium, hard
    expected_answer = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    transcript = Column(Text)
    audio_url = Column(String(500))
    duration_secs = Column(Integer, default=0)
    wpm = Column(Float, default=0.0)                     # Words per minute
    filler_word_count = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)        # From facial analysis
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question", back_populates="answer")
    score = relationship("Score", back_populates="answer", uselist=False)


class Score(Base):
    __tablename__ = "scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    answer_id = Column(String, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    technical_accuracy = Column(Float, default=0.0)   # 0–10
    communication = Column(Float, default=0.0)         # 0–10
    confidence = Column(Float, default=0.0)            # 0–10
    relevance = Column(Float, default=0.0)             # 0–10
    overall_score = Column(Float, default=0.0)         # Weighted average
    llm_feedback = Column(Text)
    improvement_tips = Column(JSON)                    # [{"topic": "...", "resource": "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    answer = relationship("Answer", back_populates="score")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=True)
    missing_skill = Column(String(100))
    skill_category = Column(String(100))
    priority = Column(String(20), default="medium")    # high, medium, low
    identified_at = Column(DateTime, default=datetime.utcnow)
