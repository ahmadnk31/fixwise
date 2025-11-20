"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BookingsPageStatsProps {
  total: number
  pending: number
  confirmed: number
  completed: number
}

export function BookingsPageStats({ total, pending, confirmed, completed }: BookingsPageStatsProps) {
  const { t } = useI18n()
  
  return (
    <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t.booking.totalBookings}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t.booking.pending}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t.booking.confirmed}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{confirmed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t.booking.completed}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{completed}</div>
        </CardContent>
      </Card>
    </div>
  )
}

