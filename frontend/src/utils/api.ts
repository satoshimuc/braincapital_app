import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// 本番: VITE_API_BASE_URL 環境変数を Vercel の Environment Variables に設定
// 例: https://your-backend.onrender.com
// 開発: Vite の proxy が /api を localhost:8000 に転送するのでそのまま使用
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    // ネットワーク到達不能 or タイムアウト時に分かりやすいエラーを付与
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED'
      error.friendlyMessage = isTimeout
        ? 'サーバーの起動中です。少し待ってから再度お試しください（初回は30秒ほどかかる場合があります）'
        : 'サーバーに接続できません。バックエンドのURLが正しく設定されているか確認してください'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data: {
    email: string
    password: string
    age?: number
    gender?: string
    language?: string
    consent_given: boolean
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  guest: (language?: string) => api.post('/auth/guest', { language }),

  me: () => api.get('/auth/me'),
}

// Surveys
export const surveyApi = {
  submitBatch: (data: {
    survey_type: string
    drivers?: Record<string, number>
    health?: Record<string, number>
    skills_survey?: Record<string, number>
  }) => api.post('/surveys/submit-batch', data),

  getHistory: (limit?: number) => api.get('/surveys/history', { params: { limit } }),

  getLatest: () => api.get('/surveys/latest'),

  hasBaseline: () => api.get('/surveys/has-baseline'),
}

// Cognitive Tests
export const testApi = {
  submit: (data: {
    attention?: { avg_reaction_ms: number; correct_rate: number; total_trials: number }
    memory?: { correct_count: number; total_trials: number }
    flexibility?: { avg_reaction_ms: number; correct_rate: number; total_trials: number }
    skills_survey?: Record<string, number>
  }) => api.post('/tests/submit', data),

  getHistory: () => api.get('/tests/history'),
}

// Suggestions
export const suggestionsApi = {
  get: () => api.get('/suggestions/'),
}

// Reports
export const reportApi = {
  downloadPdf: () => api.get('/reports/pdf', { responseType: 'blob' }),
}
