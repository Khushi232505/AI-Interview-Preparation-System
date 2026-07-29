'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { interviewAPI } from '@/lib/api'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    interviewAPI.getResults(sessionId)
      .then(r => { setResults(r.data); setLoading(false) })
      .catch(() => { setError('Could not load results.'); setLoading(false) })
  }, [sessionId, router])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>⏳ Loading results...</p></div>
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#f87171' }}>{error}</p></div>
  if (!results) return null

  const overall = results.total_score || 0
  const scoreColor = overall >= 7 ? '#34d399' : overall >= 5 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>← Back to Dashboard</Link>
        <Link href="/interview/setup" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Practice Again</Link>
      </div>

      {/* Overall Score Banner */}
      <div style={{ textAlign: 'center', padding: '2.5rem', borderRadius: 20, background: `linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))`, border: '1px solid rgba(99,102,241,0.2)', marginBottom: '2rem' }} className="animate-fade-in">
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          {results.target_role} Interview · {new Date(results.started_at).toLocaleDateString()}
        </p>
        <div style={{ fontSize: '5rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{overall.toFixed(1)}</div>
        <div style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '1.5rem' }}>/10 Overall Score</div>
        <p style={{ color: overall >= 7 ? '#34d399' : overall >= 5 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
          {overall >= 7 ? '🎉 Excellent performance!' : overall >= 5 ? '👍 Good effort — keep practicing!' : '💪 Room to improve — review feedback below'}
        </p>
      </div>

      {/* Per-Question Results */}
      <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>📋 Question-by-Question Results</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {results.results?.map((item: any, i: number) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Q{i + 1}</span>
              <span className={`badge badge-${item.question?.type}`}>{item.question?.type}</span>
              <span className={`badge badge-${item.question?.difficulty}`}>{item.question?.difficulty}</span>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.6 }}>{item.question?.text}</p>

            {item.answer ? (
              <>
                <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'rgba(30,41,59,0.5)', borderRadius: 10, fontSize: '0.875rem', lineHeight: 1.7, color: '#94a3b8' }}>
                  <strong style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>YOUR ANSWER</strong>
                  {item.answer.transcript || 'No answer recorded'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                  <span>📝 {Math.round(item.answer.wpm || 0)} WPM</span>
                  <span>·</span>
                  <span>🔴 {item.answer.filler_words || 0} fillers</span>
                  <span>·</span>
                  <span>👁️ {Math.round(item.answer.confidence || 0)}% confidence</span>
                </div>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic', marginBottom: '1rem' }}>No answer submitted</p>
            )}

            {item.score && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  {[
                    ['Technical', item.score.technical_accuracy],
                    ['Comm.', item.score.communication],
                    ['Confidence', item.score.confidence],
                    ['Relevance', item.score.relevance],
                  ].map(([l, v]) => (
                    <div key={l as string} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(30,41,59,0.5)', borderRadius: 8 }}>
                      <p style={{ color: '#64748b', fontSize: '0.7rem' }}>{l}</p>
                      <p style={{ fontWeight: 700, color: (v as number) >= 7 ? '#34d399' : (v as number) >= 5 ? '#fbbf24' : '#f87171' }}>{(v as number).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.7, padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: 8 }}>
                  💬 {item.score.feedback}
                </p>
                {item.score.tips?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {item.score.tips.map((tip: any, j: number) => (
                      <div key={j} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                        <span>🔗</span>
                        <span><strong style={{ color: '#a5b4fc' }}>{tip.topic}:</strong> {tip.resource}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/interview/setup" className="btn-primary">🔄 Practice Again</Link>
        <Link href="/dashboard" className="btn-secondary">📊 View Dashboard</Link>
      </div>
    </div>
  )
}
