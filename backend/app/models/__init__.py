"""Models package — imports all models so SQLAlchemy discovers them."""
from app.models.user import User
from app.models.resume import Resume
from app.models.session import InterviewSession, Question, Answer, Score, SkillGap

__all__ = ["User", "Resume", "InterviewSession", "Question", "Answer", "Score", "SkillGap"]
