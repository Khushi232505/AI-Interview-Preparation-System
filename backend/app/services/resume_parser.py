"""
Resume Parser Service
Extracts skills, experience, and education from PDF/DOCX resumes.
Uses pdfplumber for text extraction and regex + keyword matching for NLP.
(spaCy is optional — falls back to keyword matching if not available)
"""
import re
import os
from typing import Dict, List, Any, Optional
from pathlib import Path


# ─── Skill Taxonomy ───────────────────────────────────────────────────────────
SKILL_TAXONOMY = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "kotlin", "swift", "ruby", "php", "scala", "r", "matlab", "dart"
    ],
    "Frontend": [
        "react", "next.js", "vue", "angular", "html", "css", "tailwind", "bootstrap",
        "redux", "graphql", "webpack", "vite", "svelte", "jquery"
    ],
    "Backend": [
        "fastapi", "django", "flask", "express", "spring", "node.js", "nestjs",
        "laravel", "rails", "asp.net", "gin", "fiber"
    ],
    "Databases": [
        "postgresql", "mysql", "mongodb", "sqlite", "redis", "elasticsearch",
        "cassandra", "dynamodb", "oracle", "sql server", "firebase"
    ],
    "Cloud & DevOps": [
        "aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "terraform",
        "ansible", "jenkins", "github actions", "heroku", "vercel", "nginx"
    ],
    "AI & ML": [
        "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
        "keras", "nlp", "computer vision", "langchain", "hugging face", "openai",
        "pandas", "numpy", "opencv", "transformers"
    ],
    "Tools & Others": [
        "git", "linux", "agile", "scrum", "jira", "rest api", "microservices",
        "kafka", "rabbitmq", "celery", "websocket", "graphql"
    ]
}

FILLER_WORDS = ["um", "uh", "like", "basically", "actually", "you know", "sort of", "kind of", "right", "so"]


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file."""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except ImportError:
        return _fallback_pdf_extract(file_path)
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")


def _fallback_pdf_extract(file_path: str) -> str:
    """Fallback PDF extraction using PyPDF2."""
    try:
        import PyPDF2
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            return " ".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {str(e)}")


def extract_text_from_docx(file_path: str) -> str:
    """Extract raw text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except Exception as e:
        raise ValueError(f"Could not read DOCX: {str(e)}")


def extract_skills(text: str) -> Dict[str, List[str]]:
    """Match skills from text against the taxonomy."""
    text_lower = text.lower()
    found = {}
    for category, skills in SKILL_TAXONOMY.items():
        matched = [s for s in skills if s in text_lower]
        if matched:
            found[category] = matched
    return found


def extract_email(text: str) -> Optional[str]:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    match = re.search(r"(\+?\d[\d\s\-().]{8,}\d)", text)
    return match.group(0).strip() if match else None


def extract_experience_years(text: str) -> int:
    """Estimate total years of experience from text."""
    patterns = [
        r"(\d+)\+?\s+years?\s+of\s+experience",
        r"(\d+)\+?\s+years?\s+experience",
        r"experience\s+of\s+(\d+)\+?\s+years?",
    ]
    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            return int(match.group(1))

    # Count date ranges like "2020 – 2023"
    date_ranges = re.findall(r"(20\d{2})\s*[–\-]\s*(20\d{2}|present|current)", text, re.IGNORECASE)
    if date_ranges:
        total = 0
        for start, end in date_ranges:
            end_yr = 2026 if end.lower() in ["present", "current"] else int(end)
            total += max(0, end_yr - int(start))
        return min(total, 30)
    return 0


def extract_education(text: str) -> List[Dict[str, str]]:
    """Extract education entries."""
    degrees = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e", "bsc", "msc", "mba"]
    lines = text.split("\n")
    education = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(d in line_lower for d in degrees):
            education.append({
                "degree": line.strip(),
                "details": lines[i + 1].strip() if i + 1 < len(lines) else ""
            })
    return education[:5]  # Cap at 5


def calculate_match_score(resume_skills: Dict[str, List[str]], target_role: str) -> Dict[str, Any]:
    """Calculate how well the resume matches a target role."""
    role_requirements = {
        "backend engineer": ["python", "fastapi", "postgresql", "docker", "rest api", "git"],
        "frontend engineer": ["react", "javascript", "html", "css", "git"],
        "full stack engineer": ["react", "python", "postgresql", "docker", "rest api"],
        "data engineer": ["python", "sql", "spark", "aws", "pandas"],
        "data scientist": ["python", "machine learning", "pandas", "numpy", "tensorflow"],
        "devops engineer": ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux"],
        "ml engineer": ["python", "tensorflow", "pytorch", "mlops", "docker"],
        "android developer": ["kotlin", "java", "android", "git"],
        "ios developer": ["swift", "xcode", "ios", "git"],
    }

    role_key = target_role.lower()
    required = role_requirements.get(role_key, ["python", "git", "sql"])

    all_found_skills = []
    for skills in resume_skills.values():
        all_found_skills.extend(skills)

    matched = [s for s in required if s in all_found_skills]
    missing = [s for s in required if s not in all_found_skills]
    score = len(matched) / len(required) if required else 0.5

    return {
        "match_score": round(score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "required_skills": required,
    }


def parse_resume(file_path: str, target_role: str = "software engineer") -> Dict[str, Any]:
    """
    Main entry point: parse a resume file and return structured data.
    """
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        raw_text = extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Use PDF or DOCX.")

    if not raw_text or len(raw_text) < 50:
        raise ValueError("Could not extract meaningful text from the resume. Please check the file.")

    skills = extract_skills(raw_text)
    education = extract_education(raw_text)
    exp_years = extract_experience_years(raw_text)
    match_data = calculate_match_score(skills, target_role)

    # Flat list of all skills for quick access
    all_skills = []
    for skill_list in skills.values():
        all_skills.extend(skill_list)

    return {
        "raw_text": raw_text,
        "email": extract_email(raw_text),
        "phone": extract_phone(raw_text),
        "skills": skills,
        "all_skills": all_skills,
        "education": education,
        "experience_years": exp_years,
        "match_score": match_data["match_score"],
        "matched_skills": match_data["matched_skills"],
        "missing_skills": match_data["missing_skills"],
        "required_skills": match_data["required_skills"],
        "word_count": len(raw_text.split()),
    }


def analyze_speech(transcript: str) -> Dict[str, Any]:
    """
    Analyze a speech transcript for quality metrics.
    Returns WPM, filler count, and estimated communication score.
    """
    words = transcript.split()
    word_count = len(words)

    # Estimate duration from word count (avg speaking rate ~130 WPM)
    estimated_duration_secs = max(1, word_count / 130 * 60)

    filler_count = sum(
        transcript.lower().count(f" {fw} ") for fw in FILLER_WORDS
    )
    wpm = round(word_count / (estimated_duration_secs / 60), 1) if estimated_duration_secs > 0 else 0

    # Communication score heuristics
    comm_score = 7.0
    if filler_count > 10:
        comm_score -= 2.0
    elif filler_count > 5:
        comm_score -= 1.0

    if wpm > 180:
        comm_score -= 1.0  # Too fast
    elif wpm < 80 and wpm > 0:
        comm_score -= 0.5  # Too slow

    if word_count < 30:
        comm_score -= 2.0  # Too short

    return {
        "word_count": word_count,
        "wpm": wpm,
        "filler_word_count": filler_count,
        "communication_score": max(0, min(10, comm_score)),
    }
