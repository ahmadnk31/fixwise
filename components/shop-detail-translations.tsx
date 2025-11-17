'use client'

import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Package } from 'lucide-react'
import Link from 'next/link'
import { ReviewList } from './review-list'

export function ShopDetailPriceRange({ priceRange }: { priceRange: string }) {
  const { t } = useI18n()
  return (
    <div className="text-sm">
      <span className="font-medium">{t.shops.priceRange}:</span> {priceRange}
    </div>
  )
}

export function ShopDetailServicesTitle() {
  const { t } = useI18n()
  return (
    <CardTitle className="flex items-center gap-2">
      <Wrench className="h-5 w-5" />
      {t.shops.servicesOffered}
    </CardTitle>
  )
}

export function ShopDetailProductsTitle() {
  const { t } = useI18n()
  return (
    <CardTitle className="flex items-center gap-2">
      <Package className="h-5 w-5" />
      {t.shops.productsAvailable}
    </CardTitle>
  )
}

export function ShopDetailReviewsSection({ reviews }: { reviews: any[] }) {
  const { t } = useI18n()
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">{t.shops.reviews}</h2>
      <ReviewList reviews={reviews} />
    </div>
  )
}

export function ShopDetailSignInPrompt() {
  const { t } = useI18n()
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <p className="mb-4 text-sm text-muted-foreground">{t.nav.login} {t.shops.reviews}</p>
        <Button asChild>
          <Link href="/auth/login">{t.nav.login}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// Export as object for backward compatibility
export const ShopDetailTranslations = {
  PriceRange: ShopDetailPriceRange,
  ServicesTitle: ShopDetailServicesTitle,
  ProductsTitle: ShopDetailProductsTitle,
  ReviewsSection: ShopDetailReviewsSection,
  SignInPrompt: ShopDetailSignInPrompt,
}

