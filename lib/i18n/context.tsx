'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Locale, defaultLocale, getTranslations, type TranslationKey } from './translations'

type Translations = ReturnType<typeof getTranslations>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    // Auto-detect language on mount (client-side only)
    let detectedLocale: Locale = defaultLocale
    
    // First check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale | null
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'nl')) {
        detectedLocale = savedLocale
      } else if (typeof navigator !== 'undefined') {
        // Then try to detect from browser language
        const browserLang = navigator.language.split('-')[0]
        if (browserLang === 'nl') {
          detectedLocale = 'nl'
        }
      }
    }
    
    // Set the detected locale
    setLocaleState(detectedLocale)
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = detectedLocale
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }
  }

  const t = getTranslations(locale)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

