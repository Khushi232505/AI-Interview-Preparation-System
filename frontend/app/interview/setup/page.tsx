'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resumeAPI, interviewAPI } from '@/lib/api'

const ROLES = ['Backend Engineer', 'Frontend Developer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Android Developer', 'iOS Developer', 'Data Engineer', 'Software Engineer']
const SESSION_TYPES = [
  { value: 'mixed', label: '🎯 Mixed (Recommended)', desc: 'Technical + Behavioral + HR' },
  { value: 'technical', label: '⚙️ Technical Only', desc: 'Deep technical & coding questions' },
  { value: 'behavioral', label: '💬 Behavioral Only', desc: 'STAR method behavioral questions' },
]

export default function InterviewSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [targetRole, setTargetRole] = useState('Backend Engineer')
  const [sessionType, setSessionType] = useState('mixed')
  const [numQuestions, setNumQuestions] = useState(5)
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login')
  }, [router])

  const handleUpload = async () => {
    if (!resumeFile) return
    setUploading(true)
    setError('')
    try {
      const res = await resumeAPI.upload(resumeFile, targetRole)
      setResumeId(res.data.id)
      const analysis = await resumeAPI.getAnalysis(res.data.id)
      setAnalysis(analysis.data)
      setStep(2)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSkipResume = () => {
    setResumeId(null)
    setAnalysis(null)
    setStep(2)
  }

  const handleStartInterview = async () => {
    setStarting(true)
    setError('')
    try {
      const res = await interviewAPI.start({
        target_role: targetRole,
        session_type: sessionType,
        num_questions: numQuestions,
        resume_id: resumeId || undefined,
      })
      // Save questions to localStorage so the interview room can load them instantly
      localStorage.setItem(`session_${res.data.session_id}`, JSON.stringify(res.data))
      router.push(`/interview/${res.data.session_id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Could not start interview.')
      setStarting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', background: step >= s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,41,59,0.8)', border: step >= s ? 'none' : '1px solid rgba(99,102,241,0.3)', color: step >= s ? 'white' : '#64748b' }}>
                {s}
              </div>
              <span style={{ fontSize: '0.85rem', color: step >= s ? '#a5b4fc' : '#64748b', fontWeight: step >= s ? 600 : 400 }}>
                {s === 1 ? 'Upload Resume' : 'Configure'}
              </span>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.2)', borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ─── Step 1: Resume Upload ─────────────────────────────────── */}
        {step === 1 && (
          <div className="card animate-fade-in" style={{ padding: '2.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>📄 Upload Your Resume</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>We'll extract your skills to personalize interview questions. Optional but recommended.</p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Target Role</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="input-field">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Drop zone */}
            <label htmlFor="resume-upload" style={{ display: 'block', border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 12, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', background: resumeFile ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{resumeFile ? '✅' : '📤'}</div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{resumeFile ? resumeFile.name : 'Drop your resume here'}</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>PDF or DOCX · Max 10MB</p>
              <input id="resume-upload" type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files?.[0] || null)} />
            </label>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={handleUpload} disabled={!resumeFile || uploading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: !resumeFile || uploading ? 0.5 : 1 }}>
                {uploading ? '⏳ Analyzing...' : '→ Analyze Resume'}
              </button>
              <button onClick={handleSkipResume} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Skip →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Configure & Start ────────────────────────────── */}
        {step === 2 && (
          <div className="card animate-fade-in" style={{ padding: '2.5rem' }}>
            {analysis && (
              <div style={{ marginBottom: '2rem', padding: '1rem', borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>✅ Resume Analyzed!</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Match score for {targetRole}: <strong style={{ color: '#a5b4fc' }}>{Math.round(analysis.job_match_score * 100)}%</strong>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {analysis.skills?.slice(0, 8).map((s: string) => (
                    <span key={s} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: '#a5b4fc' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>⚙️ Configure Your Interview</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>Customize your mock interview experience.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Interview Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {SESSION_TYPES.map(t => (
                    <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: 10, background: sessionType === t.value ? 'rgba(99,102,241,0.1)' : 'rgba(30,41,59,0.5)', border: `1px solid ${sessionType === t.value ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.1)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="radio" name="session_type" value={t.value} checked={sessionType === t.value} onChange={e => setSessionType(e.target.value)} style={{ accentColor: '#6366f1' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</p>
                        <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 2 }}>{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>
                  Number of Questions: <span style={{ color: '#6366f1' }}>{numQuestions}</span>
                </label>
                <input type="range" min={3} max={10} value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  <span>3 (Quick)</span><span>10 (Full)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>← Back</button>
              <button onClick={handleStartInterview} disabled={starting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: starting ? 0.7 : 1 }}>
                {starting ? '⏳ Setting up...' : '🚀 Start Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
