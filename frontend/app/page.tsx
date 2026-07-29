'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const features = [
  { icon: '🎯', title: 'Personalized Questions', desc: 'AI reads your actual resume and generates questions tailored to your skills and experience.' },
  { icon: '🎙️', title: 'Voice Interview Mode', desc: 'Speak your answers naturally. Real-time speech-to-text captures your responses.' },
  { icon: '👁️', title: 'Confidence Analysis', desc: 'MediaPipe tracks eye contact and composure. Know exactly what your body language signals.' },
  { icon: '📊', title: 'Instant Scoring', desc: 'GPT-4 evaluates Technical Accuracy, Communication, Confidence & Relevance in real-time.' },
  { icon: '📈', title: 'Progress Dashboard', desc: 'Track improvement across sessions with skill radar charts and performance analytics.' },
  { icon: '💡', title: 'Actionable Feedback', desc: 'Get specific improvement tips with curated resources for every weak area.' },
]

const roles = ['Backend Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer', 'DevOps Engineer', 'Frontend Developer']

export default function HomePage() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((i) => (i + 1) % roles.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── Navbar ──────────────────────────────────────────────────── */}
      <nav style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(99,102,241,0.1)' }} className="glass-dark">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }} className="gradient-text">InterviewAI</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Log In</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Get Started →</Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <div className="animate-fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '0.4rem 1rem', marginBottom: '2rem', fontSize: '0.8rem', color: '#a5b4fc' }}>
            ✨ AI-Powered • Real-time Feedback • 100% Free to Start
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Ace Your Interview as a{' '}
            <br />
            <span className="gradient-text-animated" key={roleIndex} style={{ display: 'inline-block', animation: 'fadeIn 0.4s ease' }}>
              {roles[roleIndex]}
            </span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', lineHeight: 1.8, maxWidth: 640, margin: '0 auto 2.5rem' }}>
            Upload your resume, pick your target role, and practice with an AI interviewer that knows your background. Get scored, get feedback, get hired.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
              🚀 Start Free Practice
            </Link>
            <Link href="/login" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
              View Dashboard →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[['500+', 'Practice Questions'], ['4 Types', 'Interview Modes'], ['Real-time', 'AI Feedback'], ['Free', 'To Get Started']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }} className="gradient-text">{num}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Everything You Need to <span className="gradient-text">Succeed</span>
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
          Built with cutting-edge AI for a realistic interview experience
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {features.map((f) => (
            <div key={f.title} className="card animate-slide-up">
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem', borderRadius: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Practice?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.7 }}>
            Join thousands of students who improved their interview score by an average of <strong style={{ color: '#a5b4fc' }}>34%</strong> in 4 weeks.
          </p>
          <Link href="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#334155', borderTop: '1px solid rgba(99,102,241,0.1)', fontSize: '0.85rem' }}>
        © 2026 InterviewAI — Final Year Engineering Project · Built with Next.js + FastAPI + GPT-4
      </footer>
    </div>
  )
}
