"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Booking {
  id: string
  appointment_time: string
  user_name: string
  user_email: string
  status: string
}

interface BookingTimetableProps {
  shopId: string
  date: Date | undefined
  selectedTime: string
  onTimeSelect: (time: string) => void
  workingHours?: { start: string; end: string }
  slotDuration?: number
  maxBookingsPerSlot?: number
}

export function BookingTimetable({
  shopId,
  date,
  selectedTime,
  onTimeSelect,
  workingHours = { start: "09:00", end: "17:00" },
  slotDuration = 30,
  maxBookingsPerSlot = 1,
}: BookingTimetableProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [allSlots, setAllSlots] = useState<string[]>([])

  const generateTimeSlots = useCallback((start: string, end: string, duration: number): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`)
      currentMin += duration
      if (currentMin >= 60) {
        currentMin = 0
        currentHour++
      }
    }
    
    return slots
  }, [])

  const fetchBookings = useCallback(async (dateStr: string) => {
    if (!dateStr || !shopId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("bookings")
        .select("id, appointment_time, user_name, user_email, status")
        .eq("shop_id", shopId)
        .eq("appointment_date", dateStr)
        .in("status", ["pending", "confirmed"]) // Only count active bookings
        .order("appointment_time", { ascending: true })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Generate time slots when working hours or slot duration changes
  useEffect(() => {
    if (date) {
      setAllSlots(generateTimeSlots(workingHours.start, workingHours.end, slotDuration))
    } else {
      setAllSlots([])
    }
  }, [date, generateTimeSlots, workingHours, slotDuration])

  // Fetch bookings when date changes
  useEffect(() => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd")
      fetchBookings(dateStr)
    } else {
      setBookings([])
    }
  }, [date, fetchBookings])

  // Set up real-time subscription
  useEffect(() => {
    if (!date || !shopId) return

    const supabase = createClient()
    const dateStr = format(date, "yyyy-MM-dd")

    const channel = supabase
      .channel(`booking-timetable-${shopId}-${dateStr}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          console.log("Real-time booking change:", payload.eventType)
          const newBooking = payload.new as any
          const oldBooking = payload.old as any
          
          // Check if the booking is for the selected date
          const bookingDate = newBooking?.appointment_date || oldBooking?.appointment_date
          if (bookingDate === dateStr) {
            // Debounce the refresh
            setTimeout(() => {
              fetchBookings(dateStr)
            }, 300)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, shopId, fetchBookings])

  const getBookingsForSlot = (timeSlot: string): Booking[] => {
    // Only count active bookings (pending or confirmed)
    // Normalize time format - ensure both are in HH:MM format
    const normalizeTime = (time: string): string => {
      if (!time) return ""
      const trimmed = time.trim()
      if (trimmed.includes(':')) {
        const [hours, minutes] = trimmed.split(':')
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
      }
      return trimmed
    }
    
    const normalizedSlot = normalizeTime(timeSlot)
    return bookings.filter((b) => {
      const normalizedBookingTime = normalizeTime(b.appointment_time || "")
      return normalizedBookingTime === normalizedSlot && 
             (b.status === "pending" || b.status === "confirmed")
    })
  }

  const isSlotAvailable = (timeSlot: string): boolean => {
    const slotBookings = getBookingsForSlot(timeSlot)
    return slotBookings.length < maxBookingsPerSlot
  }

  const getSlotStatus = (timeSlot: string) => {
    const slotBookings = getBookingsForSlot(timeSlot)
    const available = slotBookings.length < maxBookingsPerSlot
    const full = slotBookings.length >= maxBookingsPerSlot

    return {
      available,
      full,
      bookings: slotBookings,
      count: slotBookings.length,
    }
  }

  if (!date) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Please select a date first</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading time slots...</p>
      </div>
    )
  }

  // Calculate statistics
  const availableCount = allSlots.filter(slot => getSlotStatus(slot).available).length
  const bookedCount = allSlots.filter(slot => !getSlotStatus(slot).available).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Available Time Slots</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {availableCount} available, {bookedCount} booked out of {allSlots.length} total
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
        {allSlots.map((slot) => {
          const status = getSlotStatus(slot)
          const isSelected = selectedTime === slot

          return (
            <button
              key={slot}
              type="button"
              onClick={() => {
                if (status.available) {
                  onTimeSelect(slot)
                }
              }}
              disabled={!status.available}
              className={cn(
                "relative rounded-lg border-2 p-3 text-left transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected && "ring-2 ring-primary ring-offset-2 border-primary",
                status.available
                  ? "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 cursor-pointer dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-950/40"
                  : "border-red-200 bg-red-50 cursor-not-allowed opacity-75 dark:border-red-800 dark:bg-red-950/20",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "font-semibold text-sm",
                  isSelected && "text-primary",
                  status.available ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                )}>
                  {slot}
                </span>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>

              {status.available ? (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Available
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Booked ({status.count}/{maxBookingsPerSlot})
                  </div>
                  {status.bookings.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate">
                      {status.bookings[0].user_name}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedTime && (
        <div className="mt-4 rounded-lg bg-primary/10 border border-primary p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Selected time: <strong>{selectedTime}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

