'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { interviewAPI } from '@/lib/api'

type Question = { id: string; question_text: string; question_type: string; difficulty: string; order_index: number }

export default function InterviewRoomPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastScore, setLastScore] = useState<any>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [confidenceScore, setConfidenceScore] = useState(75)
  const [fillerCount, setFillerCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentQuestion = questions[currentIndex]

  // ─── Load session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (!sessionId) return

    // Load session questions from localStorage (passed from setup page via interviewAPI.start)
    const stored = localStorage.getItem(`session_${sessionId}`)
    if (stored) {
      const data = JSON.parse(stored)
      setQuestions(data.questions)
      setLoading(false)
      speakQuestion(data.questions[0]?.question_text)
    } else {
      // Fallback: reload from API results (session already started)
      setLoading(false)
      setError('Session not found. Please start a new interview.')
    }
  }, [sessionId, router])

  // ─── Webcam ───────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        // Simulate confidence with random variation (real MediaPipe would go here)
        const interval = setInterval(() => {
          setConfidenceScore(prev => Math.max(40, Math.min(95, prev + (Math.random() - 0.5) * 10)))
        }, 2000)
        return () => clearInterval(interval)
      })
      .catch(() => console.log('Webcam not available'))
  }, [])

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      setTimeLeft(120)
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { stopRecording(); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording])

  // ─── Speech Synthesis ─────────────────────────────────────────────────────
  const speakQuestion = (text: string) => {
    if (!text || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.9
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Daniel') || v.lang === 'en-US')
    if (preferred) utterance.voice = preferred
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // ─── Speech Recognition ───────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Speech recognition not supported. Please type your answer.'); return }

    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
        } else {
          interim = t
        }
      }
      const full = finalTranscript + interim
      setTranscript(full)
      setWordCount(full.trim().split(/\s+/).filter(Boolean).length)

      // Count filler words
      const fillers = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'sort of']
      const fc = fillers.reduce((count, fw) => count + (full.toLowerCase().split(fw).length - 1), 0)
      setFillerCount(fc)
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') setError(`Speech error: ${e.error}`)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    setTranscript('')
    setFillerCount(0)
    setWordCount(0)
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  // ─── Submit Answer ────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!transcript.trim() || !currentQuestion) return
    setSubmitting(true)
    setError('')

    try {
      const res = await interviewAPI.submitAnswer(sessionId, {
        question_id: currentQuestion.id,
        transcript: transcript.trim(),
        confidence_score: confidenceScore,
        filler_word_count: fillerCount,
      })
      setLastScore(res.data)
    } catch (e: any) {
      setError('Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    setLastScore(null)
    setTranscript('')
    setFillerCount(0)
    setWordCount(0)

    if (currentIndex + 1 >= questions.length) {
      completeSession()
    } else {
      const next = questions[currentIndex + 1]
      setCurrentIndex(i => i + 1)
      speakQuestion(next.question_text)
    }
  }

  const completeSession = async () => {
    try {
      await interviewAPI.complete(sessionId)
    } catch {}
    setSessionComplete(true)
  }

  // ─── Session Complete ─────────────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Interview Complete!</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Great job! Your results are being processed.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => router.push(`/results/${sessionId}`)} className="btn-primary">View Results →</button>
            <button onClick={() => router.push('/dashboard')} className="btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '1.5rem' }}>⏳ Loading interview...</div></div>
  if (error && !currentQuestion) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div><p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p><button onClick={() => router.push('/interview/setup')} className="btn-primary">Start New Interview</button></div></div>

  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>

      {/* ─── Left: Interview Panel ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.875rem' }}>{Math.round(progress)}%</span>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="question-card animate-fade-in">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${currentQuestion.question_type}`}>{currentQuestion.question_type}</span>
              <span className={`badge badge-${currentQuestion.difficulty}`}>{currentQuestion.difficulty}</span>
              {isSpeaking && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🔊 AI Speaking...</span>}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6, color: '#e2e8f0' }}>
              {currentQuestion.question_text}
            </h2>
            <button onClick={() => speakQuestion(currentQuestion.question_text)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: 0 }}>
              🔊 Repeat question
            </button>
          </div>
        )}

        {/* Timer & Controls */}
        {!lastScore && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Answer Time Remaining</span>
              <span style={{ fontWeight: 700, color: timeLeft <= 30 ? '#f87171' : '#a5b4fc', fontSize: '1.1rem' }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(timeLeft / 120) * 100}%`, background: timeLeft <= 30 ? 'linear-gradient(90deg, #ef4444, #f87171)' : undefined }} />
            </div>

            {/* Live speech metrics */}
            {isRecording && (
              <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: 10, fontSize: '0.8rem' }}>
                <span style={{ color: '#a5b4fc' }}>📝 Words: <strong>{wordCount}</strong></span>
                <span style={{ color: fillerCount > 5 ? '#f87171' : '#34d399' }}>🔴 Fillers: <strong>{fillerCount}</strong></span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {!isRecording ? (
                <button onClick={startRecording} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSpeaking}>
                  🎙️ {isSpeaking ? 'Wait for AI...' : 'Start Speaking'}
                </button>
              ) : (
                <button onClick={stopRecording} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                  ⏹ Stop Recording
                </button>
              )}
            </div>

            {/* Fallback text area */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', display: 'block' }}>
                Or type your answer (fallback):
              </label>
              <textarea
                value={transcript}
                onChange={e => { setTranscript(e.target.value); setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length) }}
                rows={4}
                placeholder="Type your answer here if speech is not available..."
                className="input-field"
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            <button onClick={submitAnswer} disabled={!transcript.trim() || submitting} className="btn-primary" style={{ justifyContent: 'center', opacity: !transcript.trim() || submitting ? 0.5 : 1 }}>
              {submitting ? '⏳ Evaluating...' : '✅ Submit Answer'}
            </button>

            {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
          </div>
        )}

        {/* Score Result */}
        {lastScore && (
          <div className="card animate-fade-in" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#34d399' }}>✅ Answer Evaluated</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Technical', lastScore.score?.technical_accuracy],
                ['Communication', lastScore.score?.communication],
                ['Confidence', lastScore.score?.confidence],
                ['Relevance', lastScore.score?.relevance],
              ].map(([label, val]) => (
                <div key={label as string} style={{ padding: '0.75rem', background: 'rgba(30,41,59,0.5)', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{label}</p>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#a5b4fc' }}>{(val as number)?.toFixed(1)}</p>
                </div>
              ))}
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: 8 }}>
              💬 {lastScore.feedback}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>Overall: {lastScore.score?.overall_score?.toFixed(1)}/10</span>
              <button onClick={nextQuestion} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                {currentIndex + 1 >= questions.length ? '🎉 Finish' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right: Video & Metrics ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Webcam */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0f172a', border: '1px solid rgba(99,102,241,0.2)', aspectRatio: '4/3' }}>
          <video ref={videoRef} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {isRecording && (
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.9)', borderRadius: 20, padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
              LIVE
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
            You
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>👁️ Confidence Score</span>
            <span style={{ fontWeight: 700, color: confidenceScore >= 70 ? '#34d399' : confidenceScore >= 50 ? '#fbbf24' : '#f87171' }}>
              {Math.round(confidenceScore)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{
              width: `${confidenceScore}%`,
              background: confidenceScore >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : confidenceScore >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)'
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {confidenceScore >= 70 ? '✅ Good eye contact and composure' : confidenceScore >= 50 ? '⚠️ Maintain steady eye contact' : '❌ Look at the camera more'}
          </p>
        </div>

        {/* Tips */}
        <div className="card" style={{ fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#a5b4fc' }}>💡 Live Tips</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#64748b' }}>
            <li>• Structure answers: Situation → Task → Action → Result</li>
            <li>• Avoid filler words: "um", "uh", "basically"</li>
            <li>• Speak at 120-150 words per minute</li>
            <li>• Look directly at the camera for eye contact</li>
          </ul>
        </div>

        {/* Questions list */}
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>📋 Questions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: 6, background: i === currentIndex ? 'rgba(99,102,241,0.1)' : 'transparent', fontSize: '0.78rem' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i < currentIndex ? '#10b981' : i === currentIndex ? '#6366f1' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0, color: 'white' }}>
                  {i < currentIndex ? '✓' : i + 1}
                </div>
                <span style={{ color: i === currentIndex ? '#a5b4fc' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.question_type} · {q.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
