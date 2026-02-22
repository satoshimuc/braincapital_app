import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../utils/api'
import { getTranslations } from '../i18n'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, lang, setLang } = useAuthStore()
  const tr = getTranslations(lang)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } }; friendlyMessage?: string }
      setError(axiosError.response?.data?.detail || axiosError.friendlyMessage || tr.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.guest(lang)
      setAuth(res.data.user, res.data.access_token)
      navigate('/survey?type=baseline')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } }; friendlyMessage?: string }
      setError(axiosError.response?.data?.detail || axiosError.friendlyMessage || tr.common.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-navy via-blue-800 to-brain-teal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold text-white">{tr.app.name}</h1>
          <p className="text-blue-200 mt-2">{tr.app.tagline}</p>
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="mt-3 text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-200 hover:bg-blue-700 transition-colors"
          >
            {lang === 'ja' ? 'Switch to English' : '日本語に切替'}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{tr.auth.login}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr.auth.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr.auth.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brain-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? tr.common.loading : tr.auth.login}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-sm text-blue-600 hover:underline">
              {tr.auth.noAccount}
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full py-3 border-2 border-brain-teal text-brain-teal font-semibold rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-60"
            >
              {loading ? tr.common.loading : tr.auth.guest}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {lang === 'ja'
                ? 'ゲストモードはデータが保存されません'
                : 'Guest mode: data may not persist across sessions'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
