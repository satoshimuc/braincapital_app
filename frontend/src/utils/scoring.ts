export function getScoreLabel(score: number, lang: 'ja' | 'en'): string {
  if (score >= 80) return lang === 'ja' ? '優秀' : 'Excellent'
  if (score >= 65) return lang === 'ja' ? '良好' : 'Good'
  if (score >= 50) return lang === 'ja' ? '普通' : 'Average'
  if (score >= 35) return lang === 'ja' ? '要改善' : 'Needs Work'
  return lang === 'ja' ? '要注意' : 'Critical'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'  // green
  if (score >= 65) return '#2563eb'  // blue
  if (score >= 50) return '#f59e0b'  // amber
  if (score >= 35) return '#f97316'  // orange
  return '#ef4444'                    // red
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 65) return 'bg-blue-100 text-blue-800'
  if (score >= 50) return 'bg-amber-100 text-amber-800'
  if (score >= 35) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function formatDate(dateStr: string, lang: 'ja' | 'en'): string {
  const date = new Date(dateStr)
  if (lang === 'ja') {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
