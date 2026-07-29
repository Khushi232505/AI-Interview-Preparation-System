"""Dashboard router — analytics and stats."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.session import InterviewSession, Score, Answer
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all analytics data for the dashboard."""
    # All sessions
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).order_by(InterviewSession.started_at.asc()).all()

    total_sessions = len(sessions)
    avg_score = sum(s.total_score for s in sessions) / total_sessions if sessions else 0
    best_score = max((s.total_score for s in sessions), default=0)

    # Sessions this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = sum(1 for s in sessions if s.started_at >= week_ago)

    # Score history (for line chart)
    score_history = [
        {
            "date": s.started_at.strftime("%d %b"),
            "score": round(s.total_score, 1),
            "role": s.target_role or "General"
        }
        for s in sessions[-10:]  # Last 10 sessions
    ]

    # Aggregate scores for radar chart
    all_scores = db.query(Score).join(
        InterviewSession, Score.session_id == InterviewSession.id
    ).filter(InterviewSession.user_id == current_user.id).all()

    skill_radar = {
        "Technical Accuracy": 0,
        "Communication": 0,
        "Confidence": 0,
        "Relevance": 0,
    }
    if all_scores:
        skill_radar = {
            "Technical Accuracy": round(sum(s.technical_accuracy for s in all_scores) / len(all_scores), 1),
            "Communication": round(sum(s.communication for s in all_scores) / len(all_scores), 1),
            "Confidence": round(sum(s.confidence for s in all_scores) / len(all_scores), 1),
            "Relevance": round(sum(s.relevance for s in all_scores) / len(all_scores), 1),
        }

    # Filler word trend
    all_answers = db.query(Answer).join(
        InterviewSession, Answer.session_id == InterviewSession.id
    ).filter(InterviewSession.user_id == current_user.id).all()

    filler_trend = []
    for s in sessions[-8:]:
        session_answers = [a for a in all_answers if a.session_id == s.id]
        avg_fillers = sum(a.filler_word_count for a in session_answers) / len(session_answers) if session_answers else 0
        filler_trend.append({
            "date": s.started_at.strftime("%d %b"),
            "fillers": round(avg_fillers, 1)
        })

    # Recent sessions
    recent_sessions = [
        {
            "id": s.id,
            "target_role": s.target_role,
            "session_type": s.session_type,
            "total_score": s.total_score,
            "started_at": s.started_at.isoformat(),
            "status": s.status,
        }
        for s in sessions[-5:][::-1]
    ]

    return {
        "total_sessions": total_sessions,
        "avg_score": round(avg_score, 1),
        "best_score": round(best_score, 1),
        "sessions_this_week": sessions_this_week,
        "skill_radar": skill_radar,
        "score_history": score_history,
        "filler_word_trend": filler_trend,
        "recent_sessions": recent_sessions,
    }


@router.get("/session-breakdown")
def get_session_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get question type breakdown across all sessions."""
    from app.models.session import Question
    questions = db.query(Question).join(
        InterviewSession, Question.session_id == InterviewSession.id
    ).filter(InterviewSession.user_id == current_user.id).all()

    breakdown = {}
    for q in questions:
        t = q.question_type
        breakdown[t] = breakdown.get(t, 0) + 1

    return {"question_type_breakdown": breakdown}
