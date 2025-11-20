"use client"

import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'

export function BookingsPageHeader() {
  const { t } = useI18n()
  
  return (
    <>
      <Link href="/shop/dashboard" className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        {t.booking.backToDashboard}
      </Link>

      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl sm:text-3xl font-bold">{t.booking.bookings}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t.booking.manageBookings}</p>
      </div>
    </>
  )
}

