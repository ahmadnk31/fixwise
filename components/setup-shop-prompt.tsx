"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SetupShopPrompt() {
  const { t } = useI18n()
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardContent className="py-8 text-center">
          <p className="mb-4 text-muted-foreground">{t.booking.setUpShopFirst}</p>
          <Button asChild>
            <Link href="/shop/settings">{t.booking.setUpShop}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

