import React from 'react'
import { getScoreColor, getScoreBgColor, getScoreLabel } from '../utils/scoring'
import type { Lang } from '../i18n'

interface ScoreGaugeProps {
  score: number | null | undefined
  label: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  lang: Lang
  benchmark?: number
}

export default function ScoreGauge({
  score,
  label,
  subtitle,
  size = 'md',
  lang,
  benchmark
}: ScoreGaugeProps) {
  const radius = size === 'lg' ? 60 : size === 'sm' ? 36 : 48
  const stroke = size === 'lg' ? 8 : 6
  const circumference = 2 * Math.PI * radius
  const displayScore = score ?? 0
  const offset = circumference - (displayScore / 100) * circumference
  const color = getScoreColor(displayScore)

  const svgSize = (radius + stroke) * 2 + 4

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          {/* Score arc */}
          {score !== null && score !== undefined && (
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          )}
          {/* Benchmark arc */}
          {benchmark !== undefined && (
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius - stroke - 2}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray={2 * Math.PI * (radius - stroke - 2)}
              strokeDashoffset={
                (2 * Math.PI * (radius - stroke - 2)) -
                (benchmark / 100) * (2 * Math.PI * (radius - stroke - 2))
              }
              strokeLinecap="round"
              opacity={0.5}
            />
          )}
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score !== null && score !== undefined ? (
            <>
              <span
                className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'}`}
                style={{ color }}
              >
                {Math.round(displayScore)}
              </span>
              {size !== 'sm' && (
                <span className="text-xs text-gray-400">/100</span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className={`font-semibold text-gray-800 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
        {score !== null && score !== undefined && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBgColor(displayScore)}`}>
            {getScoreLabel(displayScore, lang)}
          </span>
        )}
      </div>
    </div>
  )
}
