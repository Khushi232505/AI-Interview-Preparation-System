"""Interview router — session management, Q&A, results."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.session import InterviewSession, Question, Answer, Score
from app.auth import get_current_user
from app.schemas import (
    InterviewStartRequest, InterviewSessionResponse,
    QuestionResponse, AnswerSubmit, ScoreResponse, SessionResultsResponse
)
from app.services import llm_service
from app.services.resume_parser import analyze_speech

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/start", response_model=dict, status_code=201)
def start_interview(
    req: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new interview session and generate questions."""
    # Load resume skills if provided
    skills = []
    resume_id = req.resume_id

    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id, Resume.user_id == current_user.id
        ).first()
        if resume and resume.parsed_skills:
            skills = resume.parsed_skills.get("all_skills", [])

    # Create session
    session = InterviewSession(
        user_id=current_user.id,
        resume_id=resume_id,
        target_role=req.target_role,
        session_type=req.session_type,
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate questions
    raw_questions = llm_service.generate_questions(
        target_role=req.target_role,
        skills=skills,
        session_type=req.session_type,
        num_questions=req.num_questions,
    )

    saved_questions = []
    for i, q_data in enumerate(raw_questions):
        question = Question(
            session_id=session.id,
            question_text=q_data.get("question_text", ""),
            question_type=q_data.get("question_type", "technical"),
            difficulty=q_data.get("difficulty", "medium"),
            expected_answer=q_data.get("expected_answer", ""),
            order_index=i,
        )
        db.add(question)
        saved_questions.append(question)

    db.commit()

    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "session_type": session.session_type,
        "total_questions": len(saved_questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "order_index": q.order_index,
            }
            for q in saved_questions
        ]
    }


@router.post("/{session_id}/answer", response_model=dict)
def submit_answer(
    session_id: str,
    answer_data: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit an answer for a question and get immediate scoring."""
    # Validate session
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != "active":
        raise HTTPException(400, "Session is not active")

    # Validate question
    question = db.query(Question).filter(
        Question.id == answer_data.question_id,
        Question.session_id == session_id
    ).first()
    if not question:
        raise HTTPException(404, "Question not found")

    # Analyze speech metrics
    speech_metrics = analyze_speech(answer_data.transcript)

    # Save answer
    answer = Answer(
        question_id=question.id,
        session_id=session_id,
        transcript=answer_data.transcript,
        duration_secs=answer_data.duration_secs,
        wpm=speech_metrics["wpm"],
        filler_word_count=speech_metrics["filler_word_count"],
        confidence_score=answer_data.confidence_score,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    # Evaluate answer
    eval_result = llm_service.evaluate_answer(
        question=question.question_text,
        answer=answer_data.transcript,
        expected_answer=question.expected_answer or "",
        question_type=question.question_type,
        confidence_score=answer_data.confidence_score,
        wpm=speech_metrics["wpm"],
        filler_count=speech_metrics["filler_word_count"],
    )

    # Save score
    score = Score(
        answer_id=answer.id,
        session_id=session_id,
        technical_accuracy=eval_result.get("technical_accuracy", 0),
        communication=eval_result.get("communication", 0),
        confidence=eval_result.get("confidence", 0),
        relevance=eval_result.get("relevance", 0),
        overall_score=eval_result.get("overall_score", 0),
        llm_feedback=eval_result.get("feedback", ""),
        improvement_tips=eval_result.get("improvement_tips", []),
    )
    db.add(score)
    db.commit()

    return {
        "answer_id": answer.id,
        "score": {
            "technical_accuracy": score.technical_accuracy,
            "communication": score.communication,
            "confidence": score.confidence,
            "relevance": score.relevance,
            "overall_score": score.overall_score,
        },
        "feedback": score.llm_feedback,
        "improvement_tips": score.improvement_tips,
        "speech_metrics": {
            "wpm": speech_metrics["wpm"],
            "filler_word_count": speech_metrics["filler_word_count"],
            "word_count": speech_metrics["word_count"],
        }
    }


@router.post("/{session_id}/complete", response_model=dict)
def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark session as complete and generate overall summary."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    # Gather all scores
    scores = db.query(Score).filter(Score.session_id == session_id).all()
    score_dicts = [
        {
            "technical_accuracy": s.technical_accuracy,
            "communication": s.communication,
            "confidence": s.confidence,
            "relevance": s.relevance,
        }
        for s in scores
    ]

    summary = llm_service.generate_session_summary(score_dicts, session.target_role or "Software Engineer")

    # Update session
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.total_score = summary["overall_score"]
    db.commit()

    return summary


@router.get("/{session_id}/results")
def get_session_results(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full results for a completed session."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    questions = db.query(Question).filter(
        Question.session_id == session_id
    ).order_by(Question.order_index).all()

    results = []
    for q in questions:
        answer = db.query(Answer).filter(
            Answer.question_id == q.id
        ).first()
        score = db.query(Score).filter(
            Score.answer_id == answer.id
        ).first() if answer else None

        results.append({
            "question": {
                "id": q.id,
                "text": q.question_text,
                "type": q.question_type,
                "difficulty": q.difficulty,
                "expected_answer": q.expected_answer,
            },
            "answer": {
                "transcript": answer.transcript if answer else "",
                "wpm": answer.wpm if answer else 0,
                "filler_words": answer.filler_word_count if answer else 0,
                "confidence": answer.confidence_score if answer else 0,
            } if answer else None,
            "score": {
                "technical_accuracy": score.technical_accuracy,
                "communication": score.communication,
                "confidence": score.confidence,
                "relevance": score.relevance,
                "overall_score": score.overall_score,
                "feedback": score.llm_feedback,
                "tips": score.improvement_tips,
            } if score else None,
        })

    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "status": session.status,
        "total_score": session.total_score,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "results": results,
    }


@router.get("/", response_model=List[InterviewSessionResponse])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all interview sessions for the current user."""
    return db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.started_at.desc()).all()
