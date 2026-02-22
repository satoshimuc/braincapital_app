import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { testApi } from '../utils/api'
import { getTranslations } from '../i18n'
import Layout from '../components/Layout'
import clsx from 'clsx'

type TestPhase = 'intro' | 'attention' | 'memory' | 'flexibility' | 'result'

// --- Attention Test ---
const ARROW_DIRECTIONS = ['left', 'right', 'up', 'down'] as const
type Direction = (typeof ARROW_DIRECTIONS)[number]

interface AttentionTrial {
  direction: Direction
  startTime: number
  responded: boolean
  correct: boolean
  reactionTime: number
}

// --- Memory Test ---
interface MemoryRound {
  sequence: number[]
  shown: boolean
  userInput: number[]
  correct: boolean
}

// --- Flexibility Test (Stroop) ---
const COLORS = ['red', 'blue', 'green', 'yellow'] as const
type Color = (typeof COLORS)[number]

interface StroopTrial {
  word: Color
  displayColor: Color
  startTime: number
  responded: boolean
  correct: boolean
  reactionTime: number
}

const ATTENTION_TRIALS = 15
const MEMORY_ROUNDS = 5
const STROOP_TRIALS = 15

function ArrowIcon({ dir }: { dir: Direction }) {
  const arrows: Record<Direction, string> = {
    left: '←',
    right: '→',
    up: '↑',
    down: '↓',
  }
  return <span className="text-7xl font-bold">{arrows[dir]}</span>
}

export default function CognitiveTest() {
  const navigate = useNavigate()
  const { lang } = useAuthStore()
  const tr = getTranslations(lang)

  const [phase, setPhase] = useState<TestPhase>('intro')

  // Attention state
  const [attTrials, setAttTrials] = useState<AttentionTrial[]>([])
  const [attIdx, setAttIdx] = useState(0)
  const [attCurrent, setAttCurrent] = useState<Direction | null>(null)
  const [attFeedback, setAttFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const attStartRef = useRef<number>(0)

  // Memory state
  const [memRounds, setMemRounds] = useState<MemoryRound[]>([])
  const [memIdx, setMemIdx] = useState(0)
  const [memPhase, setMemPhase] = useState<'show' | 'input'>('show')
  const [memShowing, setMemShowing] = useState(false)
  const [memUserInput, setMemUserInput] = useState<number[]>([])
  const memTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stroop state
  const [stroopTrials, setStroopTrials] = useState<StroopTrial[]>([])
  const [stroopIdx, setStroopIdx] = useState(0)
  const [stroopCurrent, setStroopCurrent] = useState<StroopTrial | null>(null)
  const [stroopFeedback, setStroopFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const stroopStartRef = useRef<number>(0)

  // Final results
  const [results, setResults] = useState<{
    attention_score?: number
    memory_score?: number
    flexibility_score?: number
    pillar3_score?: number
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // --- Attention test logic ---
  const startAttention = useCallback(() => {
    const trials: AttentionTrial[] = []
    for (let i = 0; i < ATTENTION_TRIALS; i++) {
      trials.push({
        direction: ARROW_DIRECTIONS[Math.floor(Math.random() * 4)],
        startTime: 0,
        responded: false,
        correct: false,
        reactionTime: 0,
      })
    }
    setAttTrials(trials)
    setAttIdx(0)
    setPhase('attention')
    showNextArrow(trials, 0)
  }, [])

  const showNextArrow = (trials: AttentionTrial[], idx: number) => {
    if (idx >= trials.length) return
    setTimeout(() => {
      setAttCurrent(trials[idx].direction)
      attStartRef.current = Date.now()
      setAttFeedback(null)
    }, 600)
  }

  const handleAttentionClick = (dir: Direction) => {
    if (attCurrent === null) return
    const rt = Date.now() - attStartRef.current
    const correct = dir === attCurrent
    setAttFeedback(correct ? 'correct' : 'incorrect')

    setAttTrials((prev) => {
      const updated = [...prev]
      updated[attIdx] = { ...updated[attIdx], responded: true, correct, reactionTime: rt }
      return updated
    })

    setAttCurrent(null)

    const nextIdx = attIdx + 1
    setAttIdx(nextIdx)

    if (nextIdx >= ATTENTION_TRIALS) {
      setTimeout(() => startMemory(), 800)
    } else {
      setAttTrials((prev) => {
        showNextArrow(prev, nextIdx)
        return prev
      })
    }
  }

  // --- Memory test logic ---
  const startMemory = useCallback(() => {
    const rounds: MemoryRound[] = []
    for (let i = 0; i < MEMORY_ROUNDS; i++) {
      const len = i + 3 // 3, 4, 5, 6, 7 digits
      const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 9) + 1)
      rounds.push({ sequence: seq, shown: false, userInput: [], correct: false })
    }
    setMemRounds(rounds)
    setMemIdx(0)
    setMemUserInput([])
    setMemPhase('show')
    setPhase('memory')
    startShowSequence(rounds, 0)
  }, [])

  const startShowSequence = (rounds: MemoryRound[], idx: number) => {
    if (idx >= rounds.length) return
    setMemShowing(true)
    setMemUserInput([])
    const seq = rounds[idx].sequence
    let i = 0
    const showNext = () => {
      if (i < seq.length) {
        i++
        memTimerRef.current = setTimeout(showNext, 800)
      } else {
        setMemShowing(false)
        setMemPhase('input')
      }
    }
    memTimerRef.current = setTimeout(showNext, 500)
  }

  const handleMemoryInput = (digit: number) => {
    const newInput = [...memUserInput, digit]
    setMemUserInput(newInput)

    const seq = memRounds[memIdx].sequence
    if (newInput.length === seq.length) {
      const correct = JSON.stringify(newInput) === JSON.stringify(seq)
      setMemRounds((prev) => {
        const updated = [...prev]
        updated[memIdx] = { ...updated[memIdx], shown: true, userInput: newInput, correct }
        return updated
      })

      const nextIdx = memIdx + 1
      if (nextIdx >= MEMORY_ROUNDS) {
        setTimeout(() => startFlexibility(), 600)
      } else {
        setMemIdx(nextIdx)
        setMemPhase('show')
        setMemUserInput([])
        setTimeout(() => startShowSequence(memRounds, nextIdx), 400)
      }
    }
  }

  // --- Stroop test logic ---
  const startFlexibility = useCallback(() => {
    const trials: StroopTrial[] = []
    for (let i = 0; i < STROOP_TRIALS; i++) {
      const word = COLORS[Math.floor(Math.random() * 4)]
      let displayColor: Color
      // 60% mismatch, 40% match
      if (Math.random() < 0.6) {
        do {
          displayColor = COLORS[Math.floor(Math.random() * 4)]
        } while (displayColor === word)
      } else {
        displayColor = word
      }
      trials.push({ word, displayColor, startTime: 0, responded: false, correct: false, reactionTime: 0 })
    }
    setStroopTrials(trials)
    setStroopIdx(0)
    setPhase('flexibility')
    showNextStroop(trials, 0)
  }, [])

  const showNextStroop = (trials: StroopTrial[], idx: number) => {
    if (idx >= trials.length) return
    setTimeout(() => {
      setStroopCurrent(trials[idx])
      stroopStartRef.current = Date.now()
      setStroopFeedback(null)
    }, 500)
  }

  const handleStroopClick = (color: Color) => {
    if (!stroopCurrent) return
    const rt = Date.now() - stroopStartRef.current
    const correct = color === stroopCurrent.displayColor
    setStroopFeedback(correct ? 'correct' : 'incorrect')

    setStroopTrials((prev) => {
      const updated = [...prev]
      updated[stroopIdx] = { ...updated[stroopIdx], responded: true, correct, reactionTime: rt }
      return updated
    })
    setStroopCurrent(null)

    const nextIdx = stroopIdx + 1
    setStroopIdx(nextIdx)

    if (nextIdx >= STROOP_TRIALS) {
      setTimeout(() => submitResults(), 600)
    } else {
      setStroopTrials((prev) => {
        showNextStroop(prev, nextIdx)
        return prev
      })
    }
  }

  const submitResults = useCallback(async () => {
    setSubmitting(true)
    try {
      // Calculate averages
      const attCorrect = attTrials.filter((t) => t.correct)
      const attAvgRT = attCorrect.length > 0
        ? attCorrect.reduce((s, t) => s + t.reactionTime, 0) / attCorrect.length
        : 500

      const memCorrect = memRounds.filter((r) => r.correct).length

      const stroopCorrect = stroopTrials.filter((t) => t.correct)
      const stroopAvgRT = stroopCorrect.length > 0
        ? stroopCorrect.reduce((s, t) => s + t.reactionTime, 0) / stroopCorrect.length
        : 600

      const payload = {
        attention: {
          avg_reaction_ms: attAvgRT,
          correct_rate: attTrials.filter((t) => t.correct).length / ATTENTION_TRIALS,
          total_trials: ATTENTION_TRIALS,
        },
        memory: {
          correct_count: memCorrect,
          total_trials: MEMORY_ROUNDS,
        },
        flexibility: {
          avg_reaction_ms: stroopAvgRT,
          correct_rate: stroopTrials.filter((t) => t.correct).length / STROOP_TRIALS,
          total_trials: STROOP_TRIALS,
        },
      }

      const res = await testApi.submit(payload)
      setResults(res.data)
      setPhase('result')
    } catch {
      setPhase('result')
      setResults({ attention_score: 0, memory_score: 0, flexibility_score: 0, pillar3_score: 0 })
    } finally {
      setSubmitting(false)
    }
  }, [attTrials, memRounds, stroopTrials])

  const colorMap: Record<Color, string> = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
  }

  const colorBgMap: Record<Color, string> = {
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    yellow: 'bg-yellow-400 hover:bg-yellow-500',
  }

  const colorLabel: Record<Color, string> = lang === 'ja'
    ? { red: tr.cogTest.red, blue: tr.cogTest.blue, green: tr.cogTest.green, yellow: tr.cogTest.yellow }
    : { red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow' }

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (memTimerRef.current) clearTimeout(memTimerRef.current)
    }
  }, [])

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Intro */}
        {phase === 'intro' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🧬</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{tr.cogTest.title}</h1>
            <p className="text-gray-500 mb-8">{tr.cogTest.subtitle}</p>

            <div className="grid gap-4 mb-8 text-left">
              {[
                { icon: '🎯', name: tr.cogTest.attention, desc: tr.cogTest.attentionDesc },
                { icon: '🔢', name: tr.cogTest.memory, desc: tr.cogTest.memoryDesc },
                { icon: '🌈', name: tr.cogTest.flexibility, desc: tr.cogTest.flexibilityDesc },
              ].map((t) => (
                <div key={t.name} className="flex gap-3 bg-gray-50 rounded-xl p-4">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startAttention}
              className="w-full py-4 bg-brain-blue text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors"
            >
              {tr.cogTest.start}
            </button>
          </div>
        )}

        {/* Attention Test */}
        {phase === 'attention' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">🎯 {tr.cogTest.attention}</h2>
              <span className="text-sm text-gray-400">
                {tr.cogTest.trial} {attIdx + 1}{tr.cogTest.of}{ATTENTION_TRIALS}
              </span>
            </div>

            <p className="text-center text-sm text-gray-500 mb-8">{tr.cogTest.attentionDesc}</p>

            {/* Arrow display */}
            <div className="flex items-center justify-center h-36 mb-8">
              {attCurrent ? (
                <div className={clsx(
                  'transition-all duration-100',
                  attFeedback === 'correct' ? 'text-green-500' : attFeedback === 'incorrect' ? 'text-red-500' : 'text-gray-800'
                )}>
                  <ArrowIcon dir={attCurrent} />
                </div>
              ) : (
                <div className="text-gray-200 text-7xl font-bold">·</div>
              )}
            </div>

            {/* Direction buttons */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <div />
              <button
                onClick={() => handleAttentionClick('up')}
                disabled={!attCurrent}
                className="aspect-square bg-brain-navy text-white text-2xl rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-colors"
              >↑</button>
              <div />
              <button
                onClick={() => handleAttentionClick('left')}
                disabled={!attCurrent}
                className="aspect-square bg-brain-navy text-white text-2xl rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-colors"
              >←</button>
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                {attFeedback === 'correct' && <span className="text-green-500 text-2xl">✓</span>}
                {attFeedback === 'incorrect' && <span className="text-red-500 text-2xl">✗</span>}
              </div>
              <button
                onClick={() => handleAttentionClick('right')}
                disabled={!attCurrent}
                className="aspect-square bg-brain-navy text-white text-2xl rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-colors"
              >→</button>
              <div />
              <button
                onClick={() => handleAttentionClick('down')}
                disabled={!attCurrent}
                className="aspect-square bg-brain-navy text-white text-2xl rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-colors"
              >↓</button>
              <div />
            </div>

            {/* Progress */}
            <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brain-blue rounded-full transition-all"
                style={{ width: `${(attIdx / ATTENTION_TRIALS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Memory Test */}
        {phase === 'memory' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">🔢 {tr.cogTest.memory}</h2>
              <span className="text-sm text-gray-400">
                {tr.cogTest.trial} {memIdx + 1}{tr.cogTest.of}{MEMORY_ROUNDS}
              </span>
            </div>

            {memPhase === 'show' && (
              <div className="text-center">
                <p className="text-gray-500 mb-8">{tr.cogTest.memoryDesc}</p>
                <div className="flex gap-3 justify-center items-center h-24">
                  {memShowing && memRounds[memIdx]?.sequence.map((n, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 bg-brain-blue text-white rounded-xl flex items-center justify-center text-2xl font-bold animate-pulse"
                    >
                      {n}
                    </div>
                  ))}
                  {!memShowing && (
                    <div className="text-gray-300 text-5xl">...</div>
                  )}
                </div>
              </div>
            )}

            {memPhase === 'input' && (
              <div>
                <p className="text-center text-gray-600 mb-4">
                  {lang === 'ja' ? '数字を同じ順番で入力してください' : 'Enter the digits in the same order'}
                </p>
                {/* User input display */}
                <div className="flex gap-2 justify-center mb-6 min-h-[3.5rem]">
                  {memRounds[memIdx]?.sequence.map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold',
                        memUserInput[i] !== undefined
                          ? 'border-brain-blue bg-blue-50 text-brain-blue'
                          : 'border-gray-300 text-gray-300'
                      )}
                    >
                      {memUserInput[i] ?? '_'}
                    </div>
                  ))}
                </div>

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleMemoryInput(n)}
                      className="py-3 bg-gray-100 hover:bg-brain-blue hover:text-white text-gray-800 text-xl font-bold rounded-xl transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                  <div />
                  <button
                    onClick={() => handleMemoryInput(0)}
                    className="py-3 bg-gray-100 hover:bg-brain-blue hover:text-white text-gray-800 text-xl font-bold rounded-xl transition-colors"
                  >
                    0
                  </button>
                  <button
                    onClick={() => setMemUserInput((p) => p.slice(0, -1))}
                    className="py-3 bg-red-100 hover:bg-red-200 text-red-600 text-xl font-bold rounded-xl transition-colors"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brain-teal rounded-full transition-all"
                style={{ width: `${(memIdx / MEMORY_ROUNDS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Flexibility / Stroop Test */}
        {phase === 'flexibility' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">🌈 {tr.cogTest.flexibility}</h2>
              <span className="text-sm text-gray-400">
                {tr.cogTest.trial} {stroopIdx + 1}{tr.cogTest.of}{STROOP_TRIALS}
              </span>
            </div>

            <p className="text-center text-sm text-blue-600 font-medium mb-6 bg-blue-50 rounded-lg py-2 px-4">
              {tr.cogTest.flexibilityDesc}
            </p>

            {/* Stroop word display */}
            <div className="flex items-center justify-center h-28 mb-8">
              {stroopCurrent ? (
                <div className={clsx(
                  'text-6xl font-bold',
                  colorMap[stroopCurrent.displayColor],
                  stroopFeedback === 'correct' ? 'scale-110' : stroopFeedback === 'incorrect' ? 'opacity-50' : ''
                )}>
                  {colorLabel[stroopCurrent.word]}
                </div>
              ) : (
                <div className="text-gray-200 text-5xl font-bold">
                  {submitting ? '...' : '·'}
                </div>
              )}
            </div>

            {/* Color buttons */}
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStroopClick(color)}
                  disabled={!stroopCurrent}
                  className={clsx(
                    'py-4 text-white text-lg font-bold rounded-xl transition-colors disabled:opacity-40',
                    colorBgMap[color]
                  )}
                >
                  {colorLabel[color]}
                </button>
              ))}
            </div>

            <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(stroopIdx / STROOP_TRIALS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && results && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{tr.cogTest.result}</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: tr.cogTest.attention, score: results.attention_score, color: 'text-brain-blue', icon: '🎯' },
                { label: tr.cogTest.memory, score: results.memory_score, color: 'text-teal-600', icon: '🔢' },
                { label: tr.cogTest.flexibility, score: results.flexibility_score, color: 'text-purple-600', icon: '🌈' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {item.score != null ? Math.round(item.score) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            {results.pillar3_score != null && (
              <div className="bg-brain-navy text-white rounded-xl p-4 mb-8">
                <p className="text-sm text-blue-200">{tr.dashboard.pillar3}</p>
                <p className="text-4xl font-bold">{Math.round(results.pillar3_score)}</p>
                <p className="text-blue-300 text-sm">/100</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-brain-blue text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                {lang === 'ja' ? 'ダッシュボードへ' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
