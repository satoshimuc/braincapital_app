import { ja } from './ja'
import { en } from './en'

export type Lang = 'ja' | 'en'

const translations = { ja, en }

export function t(lang: Lang, key: string): string {
  const keys = key.split('.')
  let result: unknown = translations[lang] || translations['ja']
  for (const k of keys) {
    if (result && typeof result === 'object' && k in (result as object)) {
      result = (result as Record<string, unknown>)[k]
    } else {
      // Fallback to Japanese
      result = translations['ja']
      for (const k2 of keys) {
        if (result && typeof result === 'object' && k2 in (result as object)) {
          result = (result as Record<string, unknown>)[k2]
        } else {
          return key
        }
      }
      break
    }
  }
  return typeof result === 'string' ? result : key
}

export function getTranslations(lang: Lang) {
  return translations[lang] || translations['ja']
}

export { ja, en }
