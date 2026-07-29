"""SQLAlchemy Resume model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500), nullable=False)
    original_filename = Column(String(255))
    raw_text = Column(Text)
    parsed_skills = Column(JSON)          # {"skills": [...], "experience": [...], "education": [...]}
    embedding_id = Column(String(255))    # ChromaDB document ID
    job_match_score = Column(Float, default=0.0)
    target_role = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume")
