# 🤖 AI Interview Preparation System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**An AI-powered mock interview platform that analyzes your resume, generates personalized questions, and scores your answers across multiple dimensions.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Configuration](#-configuration) • [API Docs](#-api-reference) • [Deployment](#-deployment)

</div>

---

## ✨ Features

- 📄 **Resume Analysis** — Upload PDF or DOCX resumes; the system extracts skills, experience, and calculates a job-match score for your target role
- 🎯 **Personalized Question Generation** — AI-generated questions tailored to your skill set and target role (Technical, Behavioral, Coding, HR)
- 🧠 **LLM-as-Judge Scoring** — Each answer is evaluated on four dimensions: Technical Accuracy, Communication, Confidence, and Relevance
- 📊 **Session Dashboard** — Visual analytics showing performance trends, strengths, weaknesses, and skill gaps over multiple sessions
- 🔒 **JWT Authentication** — Secure user registration and login with token-based auth (24-hour expiry)
- 🌐 **Mock AI Mode** — Fully functional without an OpenAI API key, using a built-in question bank and heuristic scoring
- ☁️ **Railway-Ready Deployment** — Pre-configured `railway.toml` for both frontend and backend services

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** 0.115 | REST API framework |
| **SQLAlchemy** 2.0 + SQLite / PostgreSQL | Database ORM |
| **OpenAI GPT-4o-mini** | Question generation & answer evaluation |
| **pdfplumber / python-docx** | Resume parsing (PDF & DOCX) |
| **python-jose + passlib** | JWT auth & password hashing |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js** 14 (App Router) | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Performance analytics charts |
| **Framer Motion** | Animations & transitions |
| **Axios** | HTTP client |

---

## 📁 Project Structure

```
AI-Interview-Preparation-System/
├── 📂 backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Pydantic settings (reads .env)
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── auth.py              # JWT token utilities
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   └── (User, Resume, InterviewSession, Question, Answer, Score, SkillGap)
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # /auth/* — register, login
│   │   │   ├── resume.py        # /resume/* — upload, analyze
│   │   │   ├── interview.py     # /interview/* — start, answer, score
│   │   │   └── dashboard.py     # /dashboard/* — history & analytics
│   │   └── services/
│   │       ├── llm_service.py   # OpenAI / mock question gen & evaluation
│   │       └── resume_parser.py # PDF & DOCX text extraction
│   ├── requirements.txt
│   ├── .env.example             # Environment variable template
│   ├── Procfile                 # For Railway/Heroku deployment
│   └── railway.toml
│
├── 📂 frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   ├── dashboard/           # Analytics & session history
│   │   ├── interview/
│   │   │   ├── setup/           # Resume upload + interview config
│   │   │   └── [id]/            # Live interview room
│   │   └── results/             # Post-interview results & feedback
│   ├── lib/
│   │   └── api.ts               # Axios API client
│   ├── package.json
│   └── railway.toml
│
├── start.bat                    # One-click local startup (Windows)
└── vercel.json                  # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+ and **npm**
- (Optional) **OpenAI API Key** — works in mock mode without one

---

### 1. Clone the Repository

```bash
git clone https://github.com/Khushi232505/AI-Interview-Preparation-System.git
cd AI-Interview-Preparation-System
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# Edit .env with your values (see Configuration section below)

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

### 4. Quick Start (Windows)

Double-click **`start.bat`** in the project root — it will automatically launch the backend and provide instructions for the frontend.

---

## ⚙️ Configuration

Copy `backend/.env.example` to `backend/.env` and configure the following:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | *(change this!)* | JWT signing secret — use a random 32+ char string |
| `DATABASE_URL` | `sqlite:///./interview_prep.db` | SQLite for dev, PostgreSQL URL for prod |
| `OPENAI_API_KEY` | `sk-placeholder` | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use |
| `USE_MOCK_AI` | `true` | Set `false` to enable real AI (requires API key) |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded resumes |
| `MAX_FILE_SIZE_MB` | `10` | Maximum resume upload size |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT token lifetime (24 hours) |

> **Tip:** `USE_MOCK_AI=true` runs the full app with no API costs — great for development and testing.

---

## 🎮 How It Works

```
1. Register / Login
       ↓
2. Upload Resume (PDF/DOCX) — optional but recommended
       ↓ Skills extracted → Job match score calculated
3. Configure Interview
   • Target Role (Backend Engineer, ML Engineer, etc.)
   • Session Type: Mixed | Technical Only | Behavioral Only
   • Number of Questions: 3–10
       ↓
4. Live Interview Session
   • Questions generated by GPT-4o-mini (or built-in mock bank)
   • Submit text answers for each question
       ↓
5. AI Evaluation (per answer)
   • Technical Accuracy  (35% weight)
   • Communication       (25% weight)
   • Confidence          (20% weight)
   • Relevance           (20% weight)
       ↓
6. Results & Dashboard
   • Per-question feedback with strengths & improvement tips
   • Session summary with overall score
   • Historical trend charts across all past sessions
```

---

## 📡 API Reference

Full interactive docs: `http://localhost:8000/docs` (Swagger UI) or `http://localhost:8000/redoc`

| Group | Prefix | Description |
|---|---|---|
| Auth | `/auth` | Register, login, token management |
| Resume | `/resume` | Upload, parse, analyze resumes |
| Interview | `/interview` | Start session, submit answers, get scores |
| Dashboard | `/dashboard` | Session history, analytics, skill gaps |

### Key Endpoints

```
POST   /auth/register           Register a new user
POST   /auth/login              Login & receive JWT token

POST   /resume/upload           Upload PDF/DOCX resume
GET    /resume/{id}/analysis    Get extracted skills & match score

POST   /interview/start         Start a new interview session
POST   /interview/{id}/answer   Submit an answer & receive score
GET    /interview/{id}/results  Get full session results & feedback

GET    /dashboard/stats         Overall performance statistics
GET    /dashboard/sessions      List all past sessions
```

---

## 🚢 Deployment

### Railway (Recommended)

Both services have pre-configured `railway.toml` files for zero-config Railway deployment.

**Backend Service:**
1. Create a Railway project → Add service from GitHub → Set root to `backend/`
2. Add all variables from `.env.example`
3. Set `DATABASE_URL` to a Railway PostgreSQL plugin URL
4. Set `USE_MOCK_AI=false` and add your `OPENAI_API_KEY`

**Frontend Service:**
1. Add a second service → Set root to `frontend/`
2. Add `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

### Vercel (Frontend Only)

```bash
cd frontend
vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL in the Vercel dashboard.

---

## 🧪 Running Tests

```bash
cd backend
# Activate your virtual environment first
pytest tests/ -v
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👩‍💻 Author

**Khushi Tiwari**  
GitHub: [@Khushi232505](https://github.com/Khushi232505)

---

<div align="center">


⭐ Star this repo if it helped you land your dream job!

</div>
