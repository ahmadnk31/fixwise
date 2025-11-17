'use client'

import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'

export function ShopDetailBackLink() {
  const { t } = useI18n()
  return (
    <Link href="/shops" className="mb-6 inline-block text-sm text-primary hover:underline">
      ← {t.shops.backToShops}
    </Link>
  )
}

export function ShopDetailReviewCount({ count, averageRating }: { count: number; averageRating: number }) {
  const { t } = useI18n()
  return (
    <span className="text-sm text-muted-foreground">
      {averageRating.toFixed(1)} ({count} {count === 1 ? t.shops.review : t.shops.reviews})
    </span>
  )
}

export function ShopDetailSectionTitle({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

