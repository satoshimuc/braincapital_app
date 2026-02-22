import React from 'react'
import clsx from 'clsx'

interface LikertScaleProps {
  question: string
  value: number | null
  onChange: (value: number) => void
  scale?: number  // default 5
  labels?: Record<string, string>
  lowLabel?: string
  highLabel?: string
  required?: boolean
}

export default function LikertScale({
  question,
  value,
  onChange,
  scale = 5,
  labels,
  lowLabel,
  highLabel,
  required = true,
}: LikertScaleProps) {
  const options = Array.from({ length: scale }, (_, i) => i + 1)

  return (
    <div className="mb-6">
      <p className="text-gray-800 font-medium mb-3 leading-relaxed">
        {required && <span className="text-red-500 mr-1">*</span>}
        {question}
      </p>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      <div className="flex gap-2 justify-center">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={clsx(
              'flex-1 max-w-[60px] aspect-square rounded-xl border-2 font-semibold text-sm transition-all duration-150',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400',
              value === opt
                ? 'bg-brain-blue border-brain-blue text-white shadow-md scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {labels && value !== null && (
        <p className="text-center text-sm text-blue-600 mt-2 font-medium">
          {labels[String(value)]}
        </p>
      )}
    </div>
  )
}

interface PHQLikertProps {
  question: string
  value: number | null
  onChange: (value: number) => void
  labels: Record<string, string>
}

export function PHQLikert({ question, value, onChange, labels }: PHQLikertProps) {
  return (
    <div className="mb-6">
      <p className="text-gray-800 font-medium mb-3 leading-relaxed">
        <span className="text-red-500 mr-1">*</span>
        {question}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={clsx(
              'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-150',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400',
              value === opt
                ? 'bg-brain-blue border-brain-blue text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
            )}
          >
            {labels[String(opt)]}
          </button>
        ))}
      </div>
    </div>
  )
}
