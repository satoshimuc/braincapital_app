import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { surveyApi } from '../utils/api'
import { getTranslations } from '../i18n'
import Layout from '../components/Layout'
import ScoreGauge from '../components/ScoreGauge'
import { getScoreColor, formatDate } from '../utils/scoring'

interface ScoreRecord {
  id: number
  date: string
  survey_type: string
  pillar1_score: number | null
  pillar2_score: number | null
  pillar3_score: number | null
  total_score: number | null
}

interface LatestScore extends ScoreRecord {
  benchmark: { drivers: number; health: number; skills: number; total: number }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { lang, user } = useAuthStore()
  const tr = getTranslations(lang)

  const [latest, setLatest] = useState<LatestScore | null>(null)
  const [history, setHistory] = useState<ScoreRecord[]>([])
  const [hasBaseline, setHasBaseline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [latestRes, historyRes, baselineRes] = await Promise.all([
          surveyApi.getLatest(),
          surveyApi.getHistory(12),
          surveyApi.hasBaseline(),
        ])
        setLatest(latestRes.data)
        setHistory(historyRes.data)
        setHasBaseline(baselineRes.data.has_baseline)
      } catch {
        // no data yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Check for score drop alert
  const hasAlert =
    history.length >= 2 &&
    latest?.total_score != null &&
    history[history.length - 2]?.total_score != null &&
    (history[history.length - 2].total_score! - latest.total_score) >= 5

  // Radar data
  const radarData = latest
    ? [
        {
          subject: lang === 'ja' ? 'Drivers' : 'Drivers',
          score: latest.pillar1_score ?? 0,
          benchmark: latest.benchmark?.drivers ?? 65,
          fullMark: 100,
        },
        {
          subject: lang === 'ja' ? 'Health' : 'Health',
          score: latest.pillar2_score ?? 0,
          benchmark: latest.benchmark?.health ?? 65,
          fullMark: 100,
        },
        {
          subject: lang === 'ja' ? 'Skills' : 'Skills',
          score: latest.pillar3_score ?? 0,
          benchmark: latest.benchmark?.skills ?? 65,
          fullMark: 100,
        },
      ]
    : []

  // Line chart data
  const lineData = history.map((h) => ({
    date: formatDate(h.date, lang),
    [tr.dashboard.totalScore]: h.total_score,
    Drivers: h.pillar1_score,
    Health: h.pillar2_score,
    Skills: h.pillar3_score,
  }))

  // Bar chart data
  const barData = latest
    ? [
        { name: 'Drivers', you: latest.pillar1_score ?? 0, avg: latest.benchmark?.drivers ?? 65 },
        { name: 'Health', you: latest.pillar2_score ?? 0, avg: latest.benchmark?.health ?? 65 },
        { name: 'Skills', you: latest.pillar3_score ?? 0, avg: latest.benchmark?.skills ?? 65 },
      ]
    : []

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl animate-pulse mb-3">🧠</div>
            <p className="text-gray-500">{tr.common.loading}</p>
          </div>
        </div>
      </Layout>
    )
  }

  // No data state
  if (!latest || hasBaseline === false) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="text-8xl mb-6">🧠</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{tr.dashboard.title}</h1>
          <p className="text-gray-500 mb-8">{tr.dashboard.noData}</p>
          <Link
            to="/survey?type=baseline"
            className="inline-block px-8 py-4 bg-brain-blue text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            {tr.dashboard.startBaseline}
          </Link>
          <p className="text-xs text-gray-400 mt-4">{tr.common.disclaimer}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{tr.dashboard.title}</h1>
            {latest?.date && (
              <p className="text-sm text-gray-400 mt-0.5">
                {tr.dashboard.lastUpdated}: {formatDate(latest.date, lang)}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/survey?type=weekly"
              className="px-4 py-2 bg-brain-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 {tr.dashboard.weeklyCheckin}
            </Link>
            <Link
              to="/survey?type=monthly"
              className="px-4 py-2 bg-brain-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              📋 {tr.dashboard.monthlyAssessment}
            </Link>
          </div>
        </div>

        {/* Alert */}
        {hasAlert && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-orange-500 text-xl">⚠️</span>
            <p className="text-orange-700 text-sm font-medium">{tr.dashboard.alert}</p>
          </div>
        )}

        {/* Main score gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total score */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center border-2 border-brain-navy/10">
            <ScoreGauge
              score={latest.total_score}
              label={tr.dashboard.totalScore}
              size="lg"
              lang={lang}
              benchmark={latest.benchmark?.total}
            />
          </div>
          {/* Pillar scores */}
          {[
            { score: latest.pillar1_score, label: tr.dashboard.pillar1, sub: tr.dashboard.pillar1sub, bench: latest.benchmark?.drivers },
            { score: latest.pillar2_score, label: tr.dashboard.pillar2, sub: tr.dashboard.pillar2sub, bench: latest.benchmark?.health },
            { score: latest.pillar3_score, label: tr.dashboard.pillar3, sub: tr.dashboard.pillar3sub, bench: latest.benchmark?.skills },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
              <ScoreGauge
                score={item.score}
                label={item.label}
                subtitle={item.sub}
                size="md"
                lang={lang}
                benchmark={item.bench}
              />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Radar chart */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {lang === 'ja' ? '3柱バランス' : '3-Pillar Balance'}
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={tr.dashboard.yourScore}
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name={tr.dashboard.benchmark}
                    dataKey="benchmark"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <Legend iconSize={10} iconType="line" wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: number) => `${Math.round(v)}`} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-300">
                {tr.dashboard.noData}
              </div>
            )}
          </div>

          {/* Bar chart - you vs benchmark */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {lang === 'ja' ? 'あなた vs 同年代平均' : 'You vs Age Group Avg'}
            </h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v: number) => `${Math.round(v)}`} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="you" name={tr.dashboard.yourScore} radius={[4, 4, 0, 0]}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={getScoreColor(entry.you)} />
                    ))}
                  </Bar>
                  <Bar dataKey="avg" name={tr.dashboard.benchmark} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-300">
                {tr.dashboard.noData}
              </div>
            )}
          </div>

          {/* Actions panel */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {lang === 'ja' ? 'アクション' : 'Actions'}
            </h2>
            <Link
              to="/suggestions"
              className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
            >
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{tr.suggestions.title}</p>
                <p className="text-xs text-gray-500">{tr.suggestions.subtitle}</p>
              </div>
            </Link>
            <Link
              to="/cognitive-test"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <span className="text-2xl">🧬</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{tr.cogTest.title}</p>
                <p className="text-xs text-gray-500">{tr.cogTest.subtitle}</p>
              </div>
            </Link>
            <button
              onClick={async () => {
                try {
                  const { reportApi } = await import('../utils/api')
                  const res = await reportApi.downloadPdf()
                  const url = URL.createObjectURL(res.data)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'pbcm_report.pdf'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch {
                  alert(lang === 'ja' ? 'PDFの生成に失敗しました' : 'Failed to generate PDF')
                }
              }}
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
            >
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{tr.report.download}</p>
                <p className="text-xs text-gray-500">
                  {lang === 'ja' ? 'スコア推移・改善提案をPDF出力' : 'Export score history & suggestions'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Score trend line chart */}
        {lineData.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              📈 {tr.dashboard.trend}
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={(v: number) => v != null ? `${Math.round(v)}` : '-'} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey={tr.dashboard.totalScore}
                  stroke="#1e3a5f"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line type="monotone" dataKey="Drivers" stroke="#2563eb" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Health" stroke="#0d9488" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Skills" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  )
}
