'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { dashboardAPI, interviewAPI } from '@/lib/api'
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PolarRadiusAxis
} from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    dashboardAPI.getStats().then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [router])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) return null

  const radarData = stats ? Object.entries(stats.skill_radar).map(([name, value]) => ({ name, value, fullMark: 10 })) : []

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{ width: 240, background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(99,102,241,0.15)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <span style={{ fontWeight: 800 }} className="gradient-text">InterviewAI</span>
        </div>
        {[
          { href: '/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/interview/setup', label: 'New Interview', icon: '🎯' },
          { href: '/dashboard', label: 'History', icon: '📜' },
          { href: '/dashboard', label: 'Skill Gaps', icon: '🔍' },
        ].map(item => (
          <Link key={item.href + item.label} href={item.href} className="nav-link" style={{ borderRadius: 10, padding: '0.65rem 0.75rem' }}>
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(99,102,241,0.08)', marginBottom: '0.5rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.full_name}</p>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{user.target_role || 'No role set'}</p>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main style={{ marginLeft: 240, flex: 1, padding: '2rem', maxWidth: 'calc(100vw - 240px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Good morning, {user.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Track your progress and keep practicing!</p>
          </div>
          <Link href="/interview/setup" className="btn-primary">
            🎯 Start Interview
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
          </div>
        ) : !stats || stats.total_sessions === 0 ? (
          // Empty state
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎤</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>No Sessions Yet</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
              Start your first AI mock interview to see your performance analytics here.
            </p>
            <Link href="/interview/setup" className="btn-primary">
              🚀 Start Your First Interview
            </Link>
          </div>
        ) : (
          <>
            {/* ─── KPI Cards ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Sessions', value: stats.total_sessions, icon: '🎯', color: '#6366f1' },
                { label: 'Average Score', value: `${stats.avg_score}/10`, icon: '📊', color: '#10b981' },
                { label: 'Best Score', value: `${stats.best_score}/10`, icon: '🏆', color: '#f59e0b' },
                { label: 'This Week', value: stats.sessions_this_week, icon: '📅', color: '#8b5cf6' },
              ].map(card => (
                <div key={card.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{card.label}</p>
                    <p style={{ fontWeight: 700, fontSize: '1.4rem', color: card.color }}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Charts Row ────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Score History */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>📈 Score History</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.score_history}>
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Skill Radar */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>🕸️ Skill Radar</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(99,102,241,0.2)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── Filler Word Trend ──────────────────────────────────── */}
            {stats.filler_word_trend?.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>🗣️ Filler Word Trend (lower is better)</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={stats.filler_word_trend}>
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: '#e2e8f0' }} />
                    <Bar dataKey="fillers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ─── Recent Sessions ─────────────────────────────────────── */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>📜 Recent Sessions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.recent_sessions?.map((s: any) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.target_role}</p>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{s.session_type} · {new Date(s.started_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`score-badge ${s.total_score >= 7 ? 'score-high' : s.total_score >= 5 ? 'score-mid' : 'score-low'}`}>
                        {s.total_score.toFixed(1)}
                      </span>
                      <Link href={`/results/${s.id}`} style={{ color: '#6366f1', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
