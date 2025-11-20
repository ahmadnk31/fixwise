"use client"

import { useI18n } from "@/lib/i18n/context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, List } from 'lucide-react'
import { BookingListRealtime } from "@/components/booking-list-realtime"
import { BookingsCalendarRealtime } from "@/components/bookings-calendar-realtime"
import type { ReactNode } from "react"

interface BookingsPageTabsProps {
  bookings: any[]
  shopId: string
  interactiveCalendar?: ReactNode
}

export function BookingsPageTabs({ bookings, shopId, interactiveCalendar }: BookingsPageTabsProps) {
  const { t } = useI18n()
  
  return (
    <Tabs defaultValue="calendar" className="space-y-4">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="calendar" className="flex items-center gap-2 flex-1 sm:flex-initial">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{t.booking.calendarView}</span>
          <span className="sm:hidden">{t.nav.bookings}</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="flex items-center gap-2 flex-1 sm:flex-initial">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">{t.booking.listView}</span>
          <span className="sm:hidden">{t.common.filter}</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="calendar">
        {interactiveCalendar || (
          <BookingsCalendarRealtime 
            initialBookings={bookings} 
            shopId={shopId}
          />
        )}
      </TabsContent>
      
      <TabsContent value="list">
        <BookingListRealtime 
          initialBookings={bookings} 
          isShopOwner={true} 
          shopId={shopId}
        />
      </TabsContent>
    </Tabs>
  )
}

