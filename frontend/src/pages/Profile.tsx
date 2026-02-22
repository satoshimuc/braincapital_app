import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getTranslations } from '../i18n'
import Layout from '../components/Layout'
import api from '../utils/api'

export default function Profile() {
  const { user, lang, setLang, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()
  const tr = getTranslations(lang)

  const [age, setAge] = useState(user?.age?.toString() || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', null, {
        params: {
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
          language: lang,
        }
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 {tr.nav.profile}</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Account info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {lang === 'ja' ? 'アカウント情報' : 'Account'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                {lang === 'ja' ? 'メール' : 'Email'}: <span className="font-medium text-gray-800">{user?.email}</span>
              </p>
              {user?.is_guest && (
                <p className="text-xs text-amber-600 mt-1">
                  {lang === 'ja' ? 'ゲストモード' : 'Guest mode'}
                </p>
              )}
            </div>
          </div>

          {/* Profile settings */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {lang === 'ja' ? 'プロフィール設定' : 'Profile Settings'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={18}
                  max={100}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.auth.gender}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr.auth.noAnswer}</option>
                  <option value="male">{tr.auth.male}</option>
                  <option value="female">{tr.auth.female}</option>
                  <option value="other">{tr.auth.other}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'ja' ? '表示言語' : 'Display Language'}
                </label>
                <div className="flex gap-2">
                  {(['ja', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        lang === l
                          ? 'border-brain-blue bg-brain-blue text-white'
                          : 'border-gray-300 text-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {l === 'ja' ? '日本語' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-brain-blue text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            {saved ? (lang === 'ja' ? '保存しました ✓' : 'Saved ✓') : tr.common.save}
          </button>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={handleLogout}
              className="w-full py-3 border-2 border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              {tr.nav.logout}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">{tr.common.disclaimer}</p>
        </div>
      </div>
    </Layout>
  )
}
