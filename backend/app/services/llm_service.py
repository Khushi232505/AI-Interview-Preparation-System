"""
LLM Service — Question generation, answer evaluation, and feedback.
Supports OpenAI GPT-4o and a mock mode for development without an API key.
"""
import json
import random
from typing import List, Dict, Any, Optional
from app.config import settings


# ─── Mock Questions Database ──────────────────────────────────────────────────
MOCK_QUESTIONS = {
    "technical": {
        "easy": [
            "What is the difference between a list and a tuple in Python?",
            "Explain what REST APIs are and give an example of HTTP methods.",
            "What is the purpose of version control systems like Git?",
            "What is Object-Oriented Programming (OOP)? Name its 4 pillars.",
            "What is the difference between SQL and NoSQL databases?",
        ],
        "medium": [
            "Explain how a hash map works internally. What happens in case of collisions?",
            "What are database indexes? When should you use them and when should you avoid them?",
            "Explain the concept of microservices vs monolithic architecture.",
            "What is the difference between authentication and authorization?",
            "Describe how you would design a URL shortener service (like bit.ly).",
        ],
        "hard": [
            "Design a distributed rate limiter that works across multiple servers.",
            "Explain CAP theorem and how it affects distributed database design.",
            "How would you implement a real-time notification system that scales to millions of users?",
            "Describe the internals of a database B-tree index.",
            "How does the Python GIL (Global Interpreter Lock) work and when does it matter?",
        ]
    },
    "behavioral": [
        "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
        "Describe a project where you had to learn a new technology quickly. What was your approach?",
        "Tell me about a time you made a significant mistake at work. What happened and what did you learn?",
        "Describe a situation where you had to meet a tight deadline. How did you manage your time?",
        "Tell me about a time you disagreed with your manager's decision. What did you do?",
        "Describe a project you are most proud of and why.",
        "Tell me about a time you had to explain a technical concept to a non-technical stakeholder.",
    ],
    "coding": [
        "Write a function to reverse a string without using built-in reverse methods.",
        "Implement a function to check if a string is a palindrome.",
        "Write a function to find the two numbers in an array that sum to a target value.",
        "Implement a binary search algorithm.",
        "Write a function to find the longest common prefix among a list of strings.",
    ],
    "hr": [
        "Why do you want to work for our company?",
        "Where do you see yourself in 5 years?",
        "What are your greatest strengths and weaknesses?",
        "Why are you looking to change jobs?",
        "What motivates you in your work?",
    ]
}

EXPECTED_ANSWERS = {
    "What is the difference between a list and a tuple in Python?": (
        "Lists are mutable (can be changed after creation), tuples are immutable. "
        "Lists use square brackets [], tuples use parentheses (). Tuples are generally faster "
        "and use less memory. Tuples are hashable and can be used as dictionary keys."
    ),
    "What is Object-Oriented Programming (OOP)? Name its 4 pillars.": (
        "OOP is a programming paradigm that organizes code into objects containing data and behavior. "
        "The 4 pillars are: 1) Encapsulation - bundling data and methods, hiding internal state. "
        "2) Inheritance - deriving new classes from existing ones. "
        "3) Polymorphism - same interface for different underlying types. "
        "4) Abstraction - hiding implementation details, showing only what's necessary."
    ),
}


def _get_llm_client():
    """Return an OpenAI client if API key is configured."""
    if settings.USE_MOCK_AI or settings.OPENAI_API_KEY == "sk-placeholder":
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception:
        return None


def generate_questions(
    target_role: str,
    skills: List[str],
    session_type: str = "mixed",
    num_questions: int = 5,
    difficulty: str = "medium",
    chat_history: Optional[List[Dict]] = None,
) -> List[Dict[str, Any]]:
    """
    Generate interview questions tailored to the candidate's profile.
    Falls back to mock questions if no OpenAI key is available.
    """
    client = _get_llm_client()

    if client is None:
        return _mock_generate_questions(target_role, session_type, num_questions, difficulty)

    # ─── Real OpenAI Generation ──────────────────────────────────────────────
    skills_str = ", ".join(skills[:15]) if skills else "general software engineering"
    history_str = ""
    if chat_history:
        history_str = "\n".join([f"Q: {h['question']}\nA: {h['answer'][:200]}..." for h in chat_history[-3:]])

    system_prompt = f"""You are a senior technical interviewer at a top tech company.
You are interviewing a candidate for the role of {target_role}.
The candidate's key skills include: {skills_str}.
Interview type: {session_type} (mix of technical, behavioral, and coding questions).
Difficulty level: {difficulty}.

Generate exactly {num_questions} interview questions. Return ONLY a JSON array with this structure:
[
  {{
    "question_text": "...",
    "question_type": "technical|behavioral|coding|hr",
    "difficulty": "easy|medium|hard",
    "expected_answer": "Brief expected answer key points"
  }}
]

Guidelines:
- Technical questions should test depth of knowledge in their skills
- Behavioral questions should follow STAR method (Situation, Task, Action, Result)
- Coding questions should be solvable verbally (no IDE needed)
- Don't repeat similar questions
- Previous questions asked: {history_str if history_str else 'None'}
"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": system_prompt}],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        questions = data if isinstance(data, list) else data.get("questions", [])
        return questions[:num_questions]
    except Exception as e:
        print(f"OpenAI error: {e}, falling back to mock questions")
        return _mock_generate_questions(target_role, session_type, num_questions, difficulty)


def evaluate_answer(
    question: str,
    answer: str,
    expected_answer: str,
    question_type: str,
    confidence_score: float = 50.0,
    wpm: float = 130.0,
    filler_count: int = 0,
) -> Dict[str, Any]:
    """
    Score a candidate's answer using LLM-as-Judge.
    Returns scores for each dimension and detailed feedback.
    """
    client = _get_llm_client()

    if client is None:
        return _mock_evaluate_answer(question, answer, question_type, confidence_score, wpm, filler_count)

    prompt = f"""You are an expert interview coach and evaluator.

Question: {question}
Question Type: {question_type}
Expected Key Points: {expected_answer}
Candidate's Answer: {answer}

Additional Metrics:
- Speaking pace: {wpm:.0f} WPM (ideal: 120–160)
- Filler words used: {filler_count} ("um", "uh", etc.)
- Confidence score from facial analysis: {confidence_score:.0f}/100

Evaluate the answer and return ONLY a JSON object:
{{
  "technical_accuracy": <float 0-10>,
  "communication": <float 0-10>,
  "confidence": <float 0-10>,
  "relevance": <float 0-10>,
  "overall_score": <float 0-10>,
  "feedback": "<2-3 sentences of specific, actionable feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "improvement_tips": [
    {{"topic": "<topic>", "resource": "<YouTube search or book title>", "priority": "high|medium|low"}}
  ]
}}

Scoring rubric:
- technical_accuracy: Correctness and depth of technical content
- communication: Clarity, structure, use of examples
- confidence: Body language signals + speaking pace + minimal fillers
- relevance: How well the answer addresses the question asked
"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI evaluation error: {e}, falling back to mock evaluation")
        return _mock_evaluate_answer(question, answer, question_type, confidence_score, wpm, filler_count)


def generate_session_summary(
    session_scores: List[Dict[str, Any]],
    target_role: str,
) -> Dict[str, Any]:
    """Generate an overall session summary and recommendations."""
    if not session_scores:
        return {"summary": "No answers recorded.", "strengths": [], "weaknesses": []}

    avg_technical = sum(s.get("technical_accuracy", 0) for s in session_scores) / len(session_scores)
    avg_comm = sum(s.get("communication", 0) for s in session_scores) / len(session_scores)
    avg_conf = sum(s.get("confidence", 0) for s in session_scores) / len(session_scores)
    avg_rel = sum(s.get("relevance", 0) for s in session_scores) / len(session_scores)
    overall = (avg_technical * 0.35 + avg_comm * 0.25 + avg_conf * 0.20 + avg_rel * 0.20)

    strengths = []
    weaknesses = []

    if avg_technical >= 7: strengths.append("Strong technical knowledge")
    else: weaknesses.append("Technical accuracy needs improvement")

    if avg_comm >= 7: strengths.append("Clear and structured communication")
    else: weaknesses.append("Work on structuring answers more clearly")

    if avg_conf >= 7: strengths.append("Good confidence and composure")
    else: weaknesses.append("Practice reducing filler words and speaking with more confidence")

    if avg_rel >= 7: strengths.append("Answers are highly relevant and on-point")
    else: weaknesses.append("Ensure answers directly address what is being asked")

    return {
        "overall_score": round(overall, 1),
        "technical_accuracy": round(avg_technical, 1),
        "communication": round(avg_comm, 1),
        "confidence": round(avg_conf, 1),
        "relevance": round(avg_rel, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "summary": (
            f"You scored {overall:.1f}/10 overall for the {target_role} interview. "
            f"Your strongest area was {'technical knowledge' if avg_technical == max(avg_technical, avg_comm, avg_conf, avg_rel) else 'communication'}. "
            f"Focus on improving your {'technical accuracy' if avg_technical < 6 else 'communication skills'}."
        )
    }


# ─── Mock Implementations ─────────────────────────────────────────────────────

def _mock_generate_questions(
    target_role: str, session_type: str, num_questions: int, difficulty: str
) -> List[Dict[str, Any]]:
    """Generate mock questions when OpenAI is not available."""
    questions = []
    pool = []

    if session_type in ["technical", "mixed"]:
        pool.extend([{"q": q, "type": "technical", "diff": difficulty}
                     for q in MOCK_QUESTIONS["technical"].get(difficulty, MOCK_QUESTIONS["technical"]["medium"])])

    if session_type in ["behavioral", "mixed"]:
        pool.extend([{"q": q, "type": "behavioral", "diff": "medium"}
                     for q in MOCK_QUESTIONS["behavioral"]])

    if session_type in ["coding", "mixed"]:
        pool.extend([{"q": q, "type": "coding", "diff": difficulty}
                     for q in MOCK_QUESTIONS["coding"]])

    pool.extend([{"q": q, "type": "hr", "diff": "easy"}
                 for q in MOCK_QUESTIONS["hr"]])

    selected = random.sample(pool, min(num_questions, len(pool)))
    for i, item in enumerate(selected):
        questions.append({
            "question_text": item["q"],
            "question_type": item["type"],
            "difficulty": item["diff"],
            "expected_answer": EXPECTED_ANSWERS.get(item["q"], "Answer should cover key concepts with examples."),
            "order_index": i,
        })
    return questions


def _mock_evaluate_answer(
    question: str, answer: str, question_type: str,
    confidence_score: float, wpm: float, filler_count: int
) -> Dict[str, Any]:
    """Generate a mock evaluation when OpenAI is not available."""
    word_count = len(answer.split())

    # Simple heuristic scoring
    technical = min(10, max(2, 5 + (word_count - 50) / 30))
    communication = max(2, 8 - filler_count * 0.3 - (abs(wpm - 130) / 50))
    confidence = confidence_score / 10  # Convert 0-100 to 0-10
    relevance = 6.5 if word_count > 20 else 3.0

    overall = (technical * 0.35 + communication * 0.25 + confidence * 0.20 + relevance * 0.20)

    feedback_options = [
        f"Good attempt! Your answer covered {word_count} words. Consider adding specific examples to strengthen your response.",
        f"You mentioned the key concepts. To improve, structure your answer using the STAR method (Situation, Task, Action, Result).",
        f"Solid foundation. Try to dive deeper into the 'why' behind your technical choices for a more compelling answer.",
    ]

    return {
        "technical_accuracy": round(min(10, technical), 1),
        "communication": round(min(10, max(0, communication)), 1),
        "confidence": round(min(10, confidence), 1),
        "relevance": round(relevance, 1),
        "overall_score": round(min(10, max(0, overall)), 1),
        "feedback": random.choice(feedback_options),
        "strengths": ["Covered the basic concepts", "Showed willingness to engage with the question"],
        "improvements": ["Add more specific examples", "Reduce filler words for clearer delivery"],
        "improvement_tips": [
            {"topic": question_type.title() + " Interview Preparation", "resource": "Search: '" + question_type + " interview questions " + question[:30] + "'", "priority": "high"}
        ]
    }
