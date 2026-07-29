/**
 * API Client — Axios-based HTTP client for the FastAPI backend.
 * Automatically attaches JWT token from localStorage.
 */
import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Attach JWT on every request ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Handle 401 globally ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; target_role?: string; experience_years?: number }) =>
    api.post('/auth/register', data),

  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  me: () => api.get('/auth/me'),
}

// ─── Resume ───────────────────────────────────────────────────────────────────
export const resumeAPI = {
  upload: (file: File, targetRole: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('target_role', targetRole)
    return api.post('/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  getAnalysis: (resumeId: string) => api.get(`/resume/${resumeId}/analysis`),

  list: () => api.get('/resume/'),

  delete: (resumeId: string) => api.delete(`/resume/${resumeId}`),
}

// ─── Interview ────────────────────────────────────────────────────────────────
export const interviewAPI = {
  start: (data: { target_role: string; session_type: string; num_questions: number; resume_id?: string }) =>
    api.post('/interview/start', data),

  submitAnswer: (sessionId: string, data: {
    question_id: string
    transcript: string
    duration_secs?: number
    wpm?: number
    filler_word_count?: number
    confidence_score?: number
  }) => api.post(`/interview/${sessionId}/answer`, data),

  complete: (sessionId: string) => api.post(`/interview/${sessionId}/complete`),

  getResults: (sessionId: string) => api.get(`/interview/${sessionId}/results`),

  listSessions: () => api.get('/interview/'),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getBreakdown: () => api.get('/dashboard/session-breakdown'),
}

export default api
