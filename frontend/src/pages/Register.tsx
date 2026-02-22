import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../utils/api'
import { getTranslations } from '../i18n'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth, lang } = useAuthStore()
  const tr = getTranslations(lang)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    consent: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError(lang === 'ja' ? 'パスワードが一致しません' : 'Passwords do not match')
      return
    }
    if (!form.consent) {
      setError(lang === 'ja' ? '同意が必要です' : 'Consent is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        language: lang,
        consent_given: form.consent,
      })
      setAuth(res.data.user, res.data.access_token)
      navigate('/survey?type=baseline')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } }; friendlyMessage?: string }
      setError(axiosError.response?.data?.detail || axiosError.friendlyMessage || tr.common.error)
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-navy via-blue-800 to-brain-teal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🧠</div>
          <h1 className="text-2xl font-bold text-white">{tr.app.name}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{tr.auth.register}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.password}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.confirmPassword}</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.age}</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => set('age', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={18}
                  max={100}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.gender}</label>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr.auth.noAnswer}</option>
                  <option value="male">{tr.auth.male}</option>
                  <option value="female">{tr.auth.female}</option>
                  <option value="other">{tr.auth.other}</option>
                </select>
              </div>
            </div>

            {/* Consent */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{tr.auth.consentTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{tr.auth.consentText}</p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <span className="text-sm text-gray-700">{tr.auth.consentCheckbox}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !form.consent}
              className="w-full py-3 bg-brain-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? tr.common.loading : tr.auth.register}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              {tr.auth.alreadyHaveAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
