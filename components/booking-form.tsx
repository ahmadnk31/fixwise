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
import { BookingTimetable } from "@/components/booking-timetable"
import { CalendarIcon, Clock, Loader2, Package, Home, Mail } from "lucide-react"
import { format, addDays, isBefore, startOfDay } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n/context"
import { toast } from "sonner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface BookingFormProps {
  shopId: string
  shopName: string
  diagnosisId?: string
  userEmail?: string
  userName?: string
  onSuccess?: () => void
}

export function BookingForm({ shopId, shopName, diagnosisId, userEmail, userName, onSuccess }: BookingFormProps) {
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
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "17:00" })
  const [slotDuration, setSlotDuration] = useState(30)
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery" | "mail">("pickup")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [deliveryPricing, setDeliveryPricing] = useState({ pickup: 0, home: 15, mail: 25 })

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
        if (data.workingHours) {
          setWorkingHours(data.workingHours)
        }
        if (data.slotDuration) {
          setSlotDuration(data.slotDuration)
        }
        if (data.maxBookingsPerSlot) {
          setMaxBookingsPerSlot(data.maxBookingsPerSlot)
        }
        if (data.deliveryPricing) {
          setDeliveryPricing(data.deliveryPricing)
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
        if (data.workingHours) {
          setWorkingHours(data.workingHours)
        }
        if (data.slotDuration) {
          setSlotDuration(data.slotDuration)
        }
        if (data.maxBookingsPerSlot) {
          setMaxBookingsPerSlot(data.maxBookingsPerSlot)
        }
        if (data.deliveryPricing) {
          setDeliveryPricing(data.deliveryPricing)
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

  // Calculate payment based on delivery option
  useEffect(() => {
    // Base service price (can be fetched from shop or diagnosis)
    const basePrice = 0
    let deliveryFee = 0
    
    switch (deliveryOption) {
      case "pickup":
        deliveryFee = deliveryPricing.pickup || 0
        break
      case "delivery":
        deliveryFee = deliveryPricing.home || 15
        break
      case "mail":
        deliveryFee = deliveryPricing.mail || 25
        break
    }
    
    setPaymentAmount(basePrice + deliveryFee)
  }, [deliveryOption, deliveryPricing])

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

    if (deliveryOption === "delivery" && !deliveryAddress.trim()) {
      setError("Please provide a delivery address")
      return
    }

    if (deliveryOption === "mail" && !deliveryAddress.trim()) {
      setError("Please provide a shipping address")
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
          delivery_option: deliveryOption,
          delivery_address: deliveryOption !== "pickup" ? deliveryAddress.trim() : null,
          payment_amount: paymentAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle alternative suggestions
        if (data.alternativeTimes && data.alternativeTimes.length > 0) {
          setAlternativeTimes(data.alternativeTimes)
          const errorMsg = `${data.error} ${t.booking.alternativeTimes} ${data.alternativeTimes.join(", ")}`
          setError(errorMsg)
          toast.error(data.error || t.booking.bookingError, {
            description: t.booking.alternativeTimes + " " + data.alternativeTimes.join(", "),
          })
        } else if (data.alternativeDates && data.alternativeDates.length > 0) {
          setAlternativeDates(data.alternativeDates)
          const errorMsg = `${data.error} ${t.booking.alternativeDates} ${data.alternativeDates.map((d: string) => format(new Date(d), "PPP")).join(", ")}`
          setError(errorMsg)
          toast.error(data.error || t.booking.bookingError, {
            description: t.booking.alternativeDates + " " + data.alternativeDates.map((d: string) => format(new Date(d), "PPP")).join(", "),
          })
        } else {
          setError(data.error || t.booking.bookingError)
          toast.error(data.error || t.booking.bookingError)
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
      
      toast.success(successMessage, {
        duration: 3000,
      })
      
      // Call onSuccess callback if provided (e.g., to close dialog)
      if (onSuccess) {
        onSuccess()
      }
      
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.booking.bookingError
      setError(errorMessage)
      toast.error(errorMessage)
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
              <PopoverContent className="w-auto p-0 z-[102]">
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
            <Label>{t.booking.time} *</Label>
            <BookingTimetable
              shopId={shopId}
              date={date}
              selectedTime={time}
              onTimeSelect={setTime}
              workingHours={workingHours}
              slotDuration={slotDuration}
              maxBookingsPerSlot={maxBookingsPerSlot}
            />
            {!date && (
              <p className="text-xs text-muted-foreground">
                {t.booking.selectDateFirst}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Delivery Option *</Label>
            <RadioGroup value={deliveryOption} onValueChange={(value) => setDeliveryOption(value as "pickup" | "delivery" | "mail")}>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="flex-1">Pick up at store</span>
                  <span className="text-sm text-muted-foreground">
                    {deliveryPricing.pickup === 0 ? "Free" : `$${deliveryPricing.pickup.toFixed(2)}`}
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="flex-1">Home delivery</span>
                  <span className="text-sm text-muted-foreground">+${deliveryPricing.home.toFixed(2)}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
                <RadioGroupItem value="mail" id="mail" />
                <Label htmlFor="mail" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="flex-1">Send by mail</span>
                  <span className="text-sm text-muted-foreground">+${deliveryPricing.mail.toFixed(2)}</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(deliveryOption === "delivery" || deliveryOption === "mail") && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">
                {deliveryOption === "delivery" ? "Delivery Address" : "Shipping Address"} *
              </Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={deliveryOption === "delivery" ? "Enter your delivery address" : "Enter your shipping address"}
                rows={3}
                required
              />
            </div>
          )}

          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Total Payment</Label>
              <span className="text-2xl font-bold">${paymentAmount.toFixed(2)}</span>
            </div>
            {deliveryOption !== "pickup" && (
              <p className="text-xs text-muted-foreground mt-1">
                Includes {deliveryOption === "delivery" ? "home delivery fee" : "shipping fee"}
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
