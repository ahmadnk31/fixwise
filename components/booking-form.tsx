"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"
import { format, addDays, isBefore, startOfDay } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n/context"

interface BookingFormProps {
  shopId: string
  shopName: string
  diagnosisId?: string
  userEmail?: string
  userName?: string
}

export function BookingForm({ shopId, shopName, diagnosisId, userEmail, userName }: BookingFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [name, setName] = useState(userName || "")
  const [email, setEmail] = useState(userEmail || "")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30)
  const [requirePhone, setRequirePhone] = useState(false)
  const [alternativeTimes, setAlternativeTimes] = useState<string[]>([])
  const [alternativeDates, setAlternativeDates] = useState<string[]>([])

  const fetchAvailableSlots = useCallback(async (selectedDate: Date) => {
    setLoadingSlots(true)
    setTime("")
    setError("") // Clear previous errors
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(`/api/bookings/available-slots?shop_id=${shopId}&date=${dateStr}`)
      const data = await response.json()

      if (response.ok && data.availableSlots) {
        setTimeSlots(data.availableSlots)
        if (data.advance_booking_days) {
          setMaxAdvanceDays(data.advance_booking_days)
        }
        if (typeof data.require_phone === "boolean") {
          setRequirePhone(data.require_phone)
        }
        // Clear error if slots are available
        if (data.availableSlots.length > 0) {
          setError("")
        } else if (data.message) {
          setError(data.message)
        }
      } else {
        setTimeSlots([])
        if (data.message) {
          setError(data.message)
        }
      }
    } catch (err) {
      console.error("Error fetching available slots:", err)
      setTimeSlots([])
      setError(t.booking.failedToLoadSlots)
    } finally {
      setLoadingSlots(false)
    }
  }, [shopId])

  // Fetch shop preferences on mount to set calendar limits
  useEffect(() => {
    const fetchShopPreferences = async () => {
      try {
        const response = await fetch(`/api/bookings/available-slots?shop_id=${shopId}&date=${format(new Date(), "yyyy-MM-dd")}`)
        const data = await response.json()
        if (data.advance_booking_days) {
          setMaxAdvanceDays(data.advance_booking_days)
        }
        if (typeof data.require_phone === "boolean") {
          setRequirePhone(data.require_phone)
        }
      } catch (err) {
        console.error("Error fetching shop preferences:", err)
      }
    }
    fetchShopPreferences()
  }, [shopId])

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date)
    } else {
      setTimeSlots([])
      setTime("")
    }
  }, [date, fetchAvailableSlots])

  // Set up real-time subscription for booking changes
  useEffect(() => {
    if (!date || !shopId) return

    const supabase = createClient()
    const dateStr = format(date, "yyyy-MM-dd")
    let refreshTimeout: NodeJS.Timeout | null = null

    // Subscribe to booking changes for this shop
    const channel = supabase
      .channel(`bookings-${shopId}-${dateStr}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "bookings",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          // Only refresh if the booking is for the selected date
          const newBooking = payload.new as { appointment_date?: string } | null
          const oldBooking = payload.old as { appointment_date?: string } | null
          const bookingDate = newBooking?.appointment_date || oldBooking?.appointment_date
          if (bookingDate === dateStr) {
            console.log("Booking change detected, refreshing available slots...")
            // Clear existing timeout and set a new one (debounce)
            if (refreshTimeout) {
              clearTimeout(refreshTimeout)
            }
            refreshTimeout = setTimeout(() => {
              fetchAvailableSlots(date)
            }, 500)
          }
        }
      )
      .subscribe()

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
      supabase.removeChannel(channel)
    }
  }, [date, shopId, fetchAvailableSlots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setAlternativeTimes([])
    setAlternativeDates([])

    if (!date || !time || !name || !email) {
      setError(t.booking.fillAllFields)
      return
    }

    if (requirePhone && !phone.trim()) {
      setError(t.booking.phoneRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          diagnosis_id: diagnosisId || null,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time,
          user_name: name,
          user_email: email,
          user_phone: phone || null,
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle alternative suggestions
        if (data.alternativeTimes && data.alternativeTimes.length > 0) {
          setAlternativeTimes(data.alternativeTimes)
          setError(`${data.error} ${t.booking.alternativeTimes} ${data.alternativeTimes.join(", ")}`)
        } else if (data.alternativeDates && data.alternativeDates.length > 0) {
          setAlternativeDates(data.alternativeDates)
          setError(`${data.error} ${t.booking.alternativeDates} ${data.alternativeDates.map((d: string) => format(new Date(d), "PPP")).join(", ")}`)
        } else {
          setError(data.error || t.booking.bookingError)
        }
        setIsSubmitting(false)
        return
      }

      // Show success message
      const successMessage = data.message || t.booking.bookingSuccess
      
      // Clear the selected time (real-time subscription will update available slots)
      setTime("")
      setNotes("")
      setAlternativeTimes([])
      setAlternativeDates([])
      
      // Real-time subscription will automatically refresh available slots
      // Keep the date selected so user can see the slot is no longer available
      
      alert(successMessage)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.booking.bookingError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseAlternativeTime = (altTime: string) => {
    setTime(altTime)
    setAlternativeTimes([])
    setError("")
  }

  const handleUseAlternativeDate = (altDate: string) => {
    setDate(new Date(altDate))
    setAlternativeDates([])
    setError("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.booking.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.booking.name} *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.booking.email} *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{requirePhone ? t.booking.phone : t.booking.phoneOptional}</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required={requirePhone}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.booking.date} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : t.booking.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => {
                    const today = startOfDay(new Date())
                    const maxDate = addDays(today, maxAdvanceDays)
                    return isBefore(date, today) || isBefore(maxDate, date)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">{t.booking.time} *</Label>
            {loadingSlots ? (
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.booking.loadingSlots}
              </div>
            ) : (
              <Select
                value={time || undefined}
                onValueChange={setTime}
                disabled={!date || timeSlots.length === 0}
                required
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={
                      !date 
                        ? t.booking.selectDateFirst
                        : timeSlots.length === 0 
                          ? t.booking.noSlots
                          : t.booking.selectTime
                    } />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {!date ? t.booking.selectDateFirst : t.booking.noSlots}
                    </div>
                  ) : (
                    timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                    {slot}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {date && timeSlots.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {timeSlots.length} {t.booking.booking}{timeSlots.length !== 1 ? "s" : ""}
              </p>
            )}
            {date && !loadingSlots && timeSlots.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t.booking.noSlots}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.booking.notes}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.booking.notes}
              rows={3}
            />
          </div>

          {error && (
            <div className="space-y-2">
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              
              {alternativeTimes.length > 0 && (
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="mb-2 text-sm font-medium">{t.booking.alternativeTimes}</p>
                  <div className="flex flex-wrap gap-2">
                    {alternativeTimes.map((altTime) => (
                      <Button
                        key={altTime}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseAlternativeTime(altTime)}
                      >
                        {altTime}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {alternativeDates.length > 0 && (
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="mb-2 text-sm font-medium">{t.booking.alternativeDates}</p>
                  <div className="flex flex-wrap gap-2">
                    {alternativeDates.map((altDate) => (
                      <Button
                        key={altDate}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseAlternativeDate(altDate)}
                      >
                        {format(new Date(altDate), "MMM d, yyyy")}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t.booking.booking + "..." : t.booking.book}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
