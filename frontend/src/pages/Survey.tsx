import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { surveyApi } from '../utils/api'
import { getTranslations } from '../i18n'
import LikertScale, { PHQLikert } from '../components/LikertScale'
import ProgressBar from '../components/ProgressBar'
import Layout from '../components/Layout'
import clsx from 'clsx'

type SurveyType = 'baseline' | 'weekly' | 'monthly'

const PILLAR1_ITEMS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] as const
const PILLAR2_ITEMS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'] as const
const PILLAR3_ITEMS = ['s1', 's2', 's3', 's4', 's5'] as const

const PHQ_ITEMS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const REVERSE_ITEMS = new Set(['d4', 'd5'])

type Step = 'drivers' | 'health' | 'skills' | 'result'

export default function Survey() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const surveyType = (searchParams.get('type') || 'weekly') as SurveyType
  const { lang } = useAuthStore()
  const tr = getTranslations(lang)

  const [step, setStep] = useState<Step>('drivers')
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')

  // Determine which pillars to show based on survey type
  const showHealth = surveyType === 'baseline' || surveyType === 'monthly'
  const showSkills = surveyType === 'baseline' || surveyType === 'monthly'

  const currentItems = step === 'drivers'
    ? [...PILLAR1_ITEMS]
    : step === 'health'
    ? [...PILLAR2_ITEMS]
    : step === 'skills'
    ? [...PILLAR3_ITEMS]
    : []

  const setAnswer = (id: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [id]: val }))
  }

  const isCurrentStepComplete = () => {
    return currentItems.every((id) => answers[id] !== undefined && answers[id] !== null)
  }

  const getNextStep = (): Step | null => {
    if (step === 'drivers') {
      if (showHealth) return 'health'
      return null
    }
    if (step === 'health') {
      if (showSkills) return 'skills'
      return null
    }
    return null
  }

  const handleNext = () => {
    const next = getNextStep()
    if (next) {
      setStep(next)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step === 'health') setStep('drivers')
    if (step === 'skills') setStep('health')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const driversData: Record<string, number> = {}
      const healthData: Record<string, number> = {}
      const skillsData: Record<string, number> = {}

      for (const id of PILLAR1_ITEMS) {
        if (answers[id] != null) driversData[id] = answers[id] as number
      }
      for (const id of PILLAR2_ITEMS) {
        if (answers[id] != null) healthData[id] = answers[id] as number
      }
      for (const id of PILLAR3_ITEMS) {
        if (answers[id] != null) skillsData[id] = answers[id] as number
      }

      const payload: Record<string, unknown> = {
        survey_type: surveyType,
        drivers: driversData,
      }
      if (showHealth && Object.keys(healthData).length > 0) {
        payload.health = healthData
      }
      if (showSkills && Object.keys(skillsData).length > 0) {
        payload.skills_survey = skillsData
      }

      const res = await surveyApi.submitBatch(payload as Parameters<typeof surveyApi.submitBatch>[0])
      setResult(res.data)
      setStep('result')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      setError(axiosError.response?.data?.detail || tr.common.error)
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = showHealth && showSkills ? 3 : showHealth ? 2 : 1
  const currentStepNum = step === 'drivers' ? 1 : step === 'health' ? 2 : step === 'skills' ? 3 : totalSteps + 1
  const isLastSurveyStep = (step === 'skills') || (step === 'health' && !showSkills) || (step === 'drivers' && !showHealth)

  const stepTitle = step === 'drivers'
    ? tr.survey.pillar1Title
    : step === 'health'
    ? tr.survey.pillar2Title
    : tr.survey.pillar3Title

  const surveyTitle = surveyType === 'baseline'
    ? tr.survey.baseline
    : surveyType === 'weekly'
    ? tr.survey.weekly
    : tr.survey.monthly

  if (step === 'result' && result) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {lang === 'ja' ? '測定完了！' : 'Measurement Complete!'}
            </h2>
            <p className="text-gray-500 mb-6">
              {lang === 'ja' ? 'あなたのBrain Capitalスコアが計算されました。' : 'Your Brain Capital scores have been calculated.'}
            </p>

            {/* Score display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {result.pillar1_score != null && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{tr.dashboard.pillar1}</p>
                  <p className="text-3xl font-bold text-brain-blue">{Math.round(result.pillar1_score)}</p>
                </div>
              )}
              {result.pillar2_score != null && (
                <div className="bg-teal-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{tr.dashboard.pillar2}</p>
                  <p className="text-3xl font-bold text-teal-600">{Math.round(result.pillar2_score)}</p>
                </div>
              )}
              {result.pillar3_score != null && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{tr.dashboard.pillar3}</p>
                  <p className="text-3xl font-bold text-purple-600">{Math.round(result.pillar3_score)}</p>
                </div>
              )}
              {result.total_score != null && (
                <div className="bg-brain-navy rounded-xl p-4 text-white">
                  <p className="text-sm text-blue-200">{tr.dashboard.totalScore}</p>
                  <p className="text-3xl font-bold">{Math.round(result.total_score)}</p>
                </div>
              )}
            </div>

            {/* CTA: cognitive test for baseline/monthly */}
            {(surveyType === 'baseline' || surveyType === 'monthly') && (
              <div className="mb-4">
                <button
                  onClick={() => navigate('/cognitive-test')}
                  className="w-full py-3 bg-brain-teal text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                >
                  {lang === 'ja' ? '続けて脳機能テストを受ける' : 'Continue to Cognitive Test'}
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 border-2 border-brain-blue text-brain-blue font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              {lang === 'ja' ? 'ダッシュボードへ' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {surveyTitle}
            </span>
            <span className="text-xs text-gray-400">
              {tr.survey.progress} {currentStepNum}/{totalSteps}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{stepTitle}</h1>
          <ProgressBar current={currentStepNum - 1} total={totalSteps} />
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 'drivers' && (
            <div>
              {PILLAR1_ITEMS.map((id) => {
                const scaleLabels = (tr.survey.scaleLabels as Record<string, { low: string; high: string }>)[id]
                return (
                  <LikertScale
                    key={id}
                    question={(tr.survey.questions as Record<string, string>)[id]}
                    value={answers[id] ?? null}
                    onChange={(v) => setAnswer(id, v)}
                    labels={tr.survey.scale as Record<string, string>}
                    lowLabel={scaleLabels?.low}
                    highLabel={scaleLabels?.high}
                  />
                )
              })}
            </div>
          )}

          {step === 'health' && (
            <div>
              {PILLAR2_ITEMS.map((id) => {
                if (PHQ_ITEMS.has(id)) {
                  return (
                    <PHQLikert
                      key={id}
                      question={(tr.survey.questions as Record<string, string>)[id]}
                      value={answers[id] ?? null}
                      onChange={(v) => setAnswer(id, v)}
                      labels={tr.survey.phqScale as Record<string, string>}
                    />
                  )
                }
                if (id === 'h7') {
                  // Stress 1-10
                  const scaleLabels = (tr.survey.scaleLabels as Record<string, { low: string; high: string }>)[id]
                  return (
                    <div key={id} className="mb-6">
                      <p className="text-gray-800 font-medium mb-3">
                        <span className="text-red-500 mr-1">*</span>
                        {(tr.survey.questions as Record<string, string>)[id]}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{scaleLabels?.low}</span>
                        <span>{scaleLabels?.high}</span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setAnswer(id, n)}
                            className={clsx(
                              'flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all',
                              answers[id] === n
                                ? 'bg-brain-blue border-brain-blue text-white'
                                : 'border-gray-200 text-gray-600 hover:border-blue-400'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                // h8: memory/concentration (1-5 scale)
                const scaleLabels = (tr.survey.scaleLabels as Record<string, { low: string; high: string }>)[id]
                return (
                  <LikertScale
                    key={id}
                    question={(tr.survey.questions as Record<string, string>)[id]}
                    value={answers[id] ?? null}
                    onChange={(v) => setAnswer(id, v)}
                    labels={tr.survey.scale as Record<string, string>}
                    lowLabel={scaleLabels?.low}
                    highLabel={scaleLabels?.high}
                  />
                )
              })}
            </div>
          )}

          {step === 'skills' && (
            <div>
              <p className="text-sm text-gray-500 mb-4 bg-blue-50 rounded-lg px-4 py-3">
                {lang === 'ja'
                  ? '以下の質問に正直にお答えください。正解・不正解はありません。'
                  : 'Please answer honestly. There are no right or wrong answers.'}
              </p>
              {PILLAR3_ITEMS.map((id) => (
                <LikertScale
                  key={id}
                  question={(tr.survey.questions as Record<string, string>)[id]}
                  value={answers[id] ?? null}
                  onChange={(v) => setAnswer(id, v)}
                  labels={tr.survey.scale as Record<string, string>}
                  lowLabel={lang === 'ja' ? '全くそう思わない' : 'Strongly disagree'}
                  highLabel={lang === 'ja' ? '強くそう思う' : 'Strongly agree'}
                />
              ))}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step !== 'drivers' && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                {tr.survey.back}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isCurrentStepComplete() || loading}
              className="flex-1 py-3 bg-brain-blue text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading
                ? tr.survey.completing
                : isLastSurveyStep
                ? tr.survey.submit
                : tr.survey.next}
            </button>
          </div>

          {/* Incomplete warning */}
          {!isCurrentStepComplete() && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {lang === 'ja' ? 'すべての質問に回答してください' : 'Please answer all questions to continue'}
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
