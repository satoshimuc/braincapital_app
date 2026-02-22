import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { suggestionsApi, reportApi } from '../utils/api'
import { getTranslations } from '../i18n'
import Layout from '../components/Layout'
import clsx from 'clsx'

interface Suggestion {
  pillar: string
  score: number
  severity: 'high' | 'medium' | 'low'
  title: string
  body: string
  actions: string[]
  disclaimer?: string
}

const pillarIcon: Record<string, string> = {
  drivers: '🌱',
  health: '❤️',
  skills: '🧠',
}

const severityConfig = {
  high: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', accent: 'border-l-red-500' },
  medium: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', accent: 'border-l-amber-500' },
  low: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', accent: 'border-l-green-500' },
}

export default function Suggestions() {
  const { lang } = useAuthStore()
  const tr = getTranslations(lang)

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    suggestionsApi.get().then((res) => {
      setSuggestions(res.data)
    }).catch(() => {
      setSuggestions([])
    }).finally(() => setLoading(false))
  }, [])

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const res = await reportApi.downloadPdf()
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pbcm_report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert(lang === 'ja' ? 'PDFの生成に失敗しました' : 'Failed to generate PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💡 {tr.suggestions.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{tr.suggestions.subtitle}</p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brain-navy text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-60"
          >
            <span>📄</span>
            {pdfLoading ? tr.report.generating : tr.report.download}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-3">💡</div>
            <p className="text-gray-400">{tr.common.loading}</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-500 mb-4">
              {lang === 'ja'
                ? 'まだ測定データがありません。ベースライン測定を完了してください。'
                : 'No measurement data yet. Please complete the baseline assessment first.'}
            </p>
            <a
              href="/survey?type=baseline"
              className="inline-block px-6 py-3 bg-brain-blue text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              {lang === 'ja' ? 'ベースライン測定を開始' : 'Start Baseline Assessment'}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((sug, idx) => {
              const config = severityConfig[sug.severity]
              return (
                <div
                  key={idx}
                  className={clsx(
                    'bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden',
                    config.accent
                  )}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pillarIcon[sug.pillar] || '📊'}</span>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {sug.pillar === 'drivers'
                              ? tr.dashboard.pillar1
                              : sug.pillar === 'health'
                              ? tr.dashboard.pillar2
                              : tr.dashboard.pillar3}
                          </p>
                          <h3 className="font-bold text-gray-800 text-lg leading-tight">{sug.title}</h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', config.badge)}>
                          {(tr.suggestions.severity as Record<string, string>)[sug.severity]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {lang === 'ja' ? 'スコア' : 'Score'}: {Math.round(sug.score)}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{sug.body}</p>

                    {/* Actions */}
                    {sug.actions && sug.actions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {tr.suggestions.actions}
                        </p>
                        <ul className="space-y-2">
                          {sug.actions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-brain-blue mt-0.5 shrink-0">✓</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    {sug.disclaimer && (
                      <p className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                        ⚠️ {sug.disclaimer}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* General disclaimer */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400">
              ⚠️ {tr.suggestions.disclaimer}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
