"""
AI Interview Preparation System — FastAPI Backend
Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import engine, Base

# Import all models so SQLAlchemy discovers them for table creation
from app.models import User, Resume, InterviewSession, Question, Answer, Score, SkillGap

from app.routers import auth, resume, interview, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created/verified")
    print(f"[OK] Upload directory: {settings.UPLOAD_DIR}")
    ai_mode = "MOCK (no OpenAI key)" if settings.USE_MOCK_AI else "OpenAI GPT-4o"
    print(f"[OK] AI Mode: {ai_mode}")
    yield
    print("[OK] Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered interview preparation system with resume analysis, dynamic Q&A, and scoring.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
# Build allowed origins list — includes localhost, Railway URLs, and any configured frontend URL
_allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.up\.railway\.app",  # Allow all Railway subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files (uploaded resumes served locally) ──────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(dashboard.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "ai_mode": "mock" if settings.USE_MOCK_AI else "openai",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
