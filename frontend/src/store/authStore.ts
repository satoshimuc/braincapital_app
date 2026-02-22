import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n'

interface User {
  id: number
  email: string
  is_guest: boolean
  age: number | null
  gender: string | null
  language: string
  consent_given: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  lang: Lang
  setAuth: (user: User, token: string) => void
  setLang: (lang: Lang) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      lang: 'ja',
      setAuth: (user, token) => {
        set({ user, token, lang: (user.language as Lang) || 'ja' })
      },
      setLang: (lang) => set({ lang }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'pbcm-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        lang: state.lang,
      }),
    }
  )
)
