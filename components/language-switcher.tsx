'use client'

import { useI18n } from '@/lib/i18n/context'
import { locales, type Locale } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'

const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger className="w-[100px] sm:w-[140px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

