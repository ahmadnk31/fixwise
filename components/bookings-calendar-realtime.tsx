"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Booking {
  id: string
  appointment_date: string
  appointment_time: string
  user_name: string
  user_email: string
  user_phone: string
  status: string
  notes: string
}

interface BookingsCalendarRealtimeProps {
  initialBookings: Booking[]
  shopId?: string
  userId?: string
}

export function BookingsCalendarRealtime({ 
  initialBookings, 
  shopId,
  userId 
}: BookingsCalendarRealtimeProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)

  useEffect(() => {
    const supabase = createClient()

    // Set up real-time subscription
    const channel = supabase
      .channel("bookings-calendar-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: shopId ? `shop_id=eq.${shopId}` : userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBooking = payload.new as Booking
            setBookings((prev) => {
              if (prev.find((b) => b.id === newBooking.id)) {
                return prev
              }
              return [...prev, newBooking]
            })
          } else if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((booking) =>
                booking.id === payload.new.id ? (payload.new as Booking) : booking
              )
            )
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) => prev.filter((booking) => booking.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId, userId])


  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return bookings.filter((b) => b.appointment_date === dateStr)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    // Navigate to timetable page
    if (shopId) {
      router.push(`/shop/bookings/${dateStr}`)
    } else if (userId) {
      router.push(`/user/bookings/${dateStr}`)
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Bookings Calendar
          </CardTitle>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[120px] sm:min-w-[150px] text-center text-sm sm:text-base font-semibold">
              {monthNames[month]} {year}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 sm:p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayBookings = getBookingsForDate(day)
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear()

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[60px] sm:min-h-[100px] cursor-pointer rounded-lg border p-1 sm:p-2 transition-colors hover:bg-accent ${
                  isToday ? "border-primary bg-primary/5" : "border-border"
                } ${dayBookings.length > 0 ? "hover:border-primary" : ""}`}
              >
                <div className={`mb-1 text-xs sm:text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{day}</div>
                <div className="space-y-0.5 sm:space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`rounded border px-0.5 sm:px-1 py-0.5 text-[10px] sm:text-xs ${
                        statusColors[booking.status as keyof typeof statusColors] || statusColors.pending
                      }`}
                    >
                      <div className="font-medium truncate">{booking.appointment_time}</div>
                      <div className="truncate hidden sm:block">{booking.user_name}</div>
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground">+{dayBookings.length - 2}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-xs sm:text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs sm:text-sm">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-xs sm:text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs sm:text-sm">Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

