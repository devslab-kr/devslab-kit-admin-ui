import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ko from './locales/ko'

export type Locale = 'en' | 'ko'

const LOCALE_KEY = 'devslab-kit-admin-locale'

function detectInitialLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
  if (stored === 'en' || stored === 'ko') return stored
  // Fall back to browser language with a Korean preference for `ko-*`.
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return nav.startsWith('ko') ? 'ko' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, ko },
})

export function setLocale(next: Locale) {
  i18n.global.locale.value = next
  localStorage.setItem(LOCALE_KEY, next)
  document.documentElement.setAttribute('lang', next)
}

export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}
