"""Resume router — upload, parse, analyze."""
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.auth import get_current_user
from app.schemas import ResumeResponse, ResumeAnalysis
from app.services.resume_parser import parse_resume
from app.config import settings

router = APIRouter(prefix="/resume", tags=["Resume"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(default="Software Engineer"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a resume PDF/DOCX and trigger parsing."""
    # Validate file extension
    import pathlib
    ext = pathlib.Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not supported. Use: {', '.join(ALLOWED_EXTENSIONS)}")

    # Validate file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(400, f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")

    # Save file
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    file_path = os.path.join(user_upload_dir, file.filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse resume
    try:
        parsed = parse_resume(file_path, target_role)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(400, str(e))

    # Save to DB
    resume = Resume(
        user_id=current_user.id,
        file_url=file_path,
        original_filename=file.filename,
        raw_text=parsed["raw_text"],
        parsed_skills={
            "skills": parsed["skills"],
            "all_skills": parsed["all_skills"],
            "education": parsed["education"],
            "experience_years": parsed["experience_years"],
            "matched_skills": parsed["matched_skills"],
            "missing_skills": parsed["missing_skills"],
        },
        job_match_score=parsed["match_score"],
        target_role=target_role,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/{resume_id}/analysis", response_model=ResumeAnalysis)
def get_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed analysis of an uploaded resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    parsed = resume.parsed_skills or {}
    all_skills = parsed.get("all_skills", [])

    return ResumeAnalysis(
        resume_id=resume.id,
        skills=all_skills,
        experience=parsed.get("education", []),
        education=parsed.get("education", []),
        job_match_score=resume.job_match_score,
        matched_skills=parsed.get("matched_skills", []),
        missing_skills=parsed.get("missing_skills", []),
        summary=(
            f"Your resume shows expertise in {', '.join(all_skills[:5])}. "
            f"Match score for {resume.target_role}: {resume.job_match_score * 100:.0f}%. "
            f"Consider adding: {', '.join(parsed.get('missing_skills', [])[:3])}."
        )
    )


@router.get("/", response_model=list[ResumeResponse])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all resumes for current user."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).all()


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    if os.path.exists(resume.file_url):
        os.remove(resume.file_url)

    db.delete(resume)
    db.commit()
