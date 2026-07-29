'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'

const ROLES = ['Backend Engineer', 'Frontend Developer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Android Developer', 'iOS Developer', 'Data Engineer']

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', target_role: 'Backend Engineer', experience_years: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.register(form)
      const loginRes = await authAPI.login(form.email, form.password)
      localStorage.setItem('token', loginRes.data.access_token)
      const me = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(me.data))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 1rem' }}>🤖</div>
            <span style={{ fontWeight: 800, fontSize: '1.4rem' }} className="gradient-text">InterviewAI</span>
          </Link>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>Create your free account and start practicing.</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem' }}>Create Account</h1>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Full Name</label>
              <input id="full-name" type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Khushi Tiwari" required className="input-field" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Email</label>
              <input id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Password</label>
              <input id="reg-password" type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min. 6 characters" required minLength={6} className="input-field" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Target Role</label>
                <select id="target-role" value={form.target_role} onChange={e => update('target_role', e.target.value)} className="input-field">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Experience (yrs)</label>
                <input id="experience" type="number" min="0" max="30" value={form.experience_years} onChange={e => update('experience_years', parseInt(e.target.value))} className="input-field" />
              </div>
            </div>

            <button id="register-btn" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
