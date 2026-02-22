import React from 'react'

interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brain-blue to-brain-teal rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
