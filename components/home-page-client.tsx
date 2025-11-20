'use client'

import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'

export function HomePageClient() {
  const { t } = useI18n()
  return <p className="text-lg text-muted-foreground">{t.home.tagline}</p>
}

interface HomePageLinksProps {
  showRegisterLink?: boolean
}

export function HomePageLinks({ showRegisterLink = true }: HomePageLinksProps) {
  const { t } = useI18n()
  return (
    <div className="flex justify-center gap-6 text-sm">
      <Link href="/shops" className="text-muted-foreground hover:underline">
        {t.home.browseShops}
      </Link>
      {showRegisterLink && (
        <Link href="/auth/sign-up" className="text-muted-foreground hover:underline">
          {t.home.registerShop}
        </Link>
      )}
    </div>
  )
}

export function HomePageFooter() {
  const { t } = useI18n()
  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      {t.home.footer}
    </footer>
  )
}

