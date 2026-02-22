import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getTranslations } from '../i18n'
import clsx from 'clsx'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, lang, logout, setLang } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const tr = getTranslations(lang)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: tr.nav.dashboard, icon: '🧠' },
    { path: '/survey', label: tr.nav.survey, icon: '📊' },
    { path: '/suggestions', label: tr.nav.suggestions, icon: '💡' },
    { path: '/profile', label: tr.nav.profile, icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-brain-light flex flex-col">
      {/* Top navbar */}
      <nav className="bg-brain-navy text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <div className="hidden sm:block">
                <span className="font-bold text-lg">PBCM</span>
                <span className="text-blue-300 text-xs block leading-none">Brain Capital Monitor</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname.startsWith(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  )}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
                className="text-xs px-2 py-1 rounded border border-blue-400 text-blue-200 hover:bg-blue-700 transition-colors"
              >
                {lang === 'ja' ? 'EN' : 'JA'}
              </button>

              {/* User info + logout */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-blue-200">
                <span>{user?.is_guest ? '👤 Guest' : user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                  title={tr.nav.logout}
                >
                  ↩
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-blue-700"
              >
                <div className="w-5 h-0.5 bg-white mb-1" />
                <div className="w-5 h-0.5 bg-white mb-1" />
                <div className="w-5 h-0.5 bg-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-blue-700 py-2 px-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium my-1',
                  location.pathname.startsWith(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-blue-700 mt-2 pt-2 text-sm text-blue-300">
              <span className="block px-3 py-1">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-300 hover:bg-blue-800 rounded-lg w-full"
              >
                ↩ {tr.nav.logout}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brain-navy text-blue-300 text-xs text-center py-3">
        {tr.common.disclaimer}
      </footer>
    </div>
  )
}
