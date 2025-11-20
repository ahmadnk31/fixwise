"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon, Plus, GripVertical } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"

interface Booking {
  id: string
  appointment_date: string
  appointment_time: string
  user_name: string
  user_email: string
  user_phone: string | null
  status: string
  notes: string | null
}

interface InteractiveBookingsCalendarProps {
  initialBookings: Booking[]
  shopId: string
  workingHours?: { start: string; end: string }
  slotDuration?: number
}

export function InteractiveBookingsCalendar({ 
  initialBookings, 
  shopId,
  workingHours = { start: "09:00", end: "17:00" },
  slotDuration = 30,
}: InteractiveBookingsCalendarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [draggedTimeBooking, setDraggedTimeBooking] = useState<Booking | null>(null)
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<string | null>(null)
  
  // Form state for new booking
  const [newBooking, setNewBooking] = useState({
    user_name: "",
    user_email: "",
    user_phone: "",
    notes: "",
    status: "pending",
  })

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
          filter: `shop_id=eq.${shopId}`,
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
  }, [shopId])

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

  const generateTimeSlots = (start: string, end: string, duration: number): string[] => {
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
  }

  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true)
    try {
      const response = await fetch(`/api/bookings/available-slots?shop_id=${shopId}&date=${date}`)
      const data = await response.json()
      if (data.slots) {
        setAvailableSlots(data.slots)
      } else {
        // Fallback to generating slots
        setAvailableSlots(generateTimeSlots(workingHours.start, workingHours.end, slotDuration))
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
      setAvailableSlots(generateTimeSlots(workingHours.start, workingHours.end, slotDuration))
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleDayClick = async (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    await fetchAvailableSlots(dateStr)
    setIsTimetableDialogOpen(true)
  }

  const getBookingsForSelectedDate = () => {
    return bookings.filter((b) => b.appointment_date === selectedDate)
  }

  const getBookingsForTimeSlot = (timeSlot: string) => {
    const normalizeTime = (time: string) => time.split(':').slice(0, 2).join(':')
    const normalizedSlot = normalizeTime(timeSlot)
    return getBookingsForSelectedDate().filter((b) => normalizeTime(b.appointment_time) === normalizedSlot)
  }

  const handleTimeSlotClick = (timeSlot: string) => {
    setSelectedTime(timeSlot)
    // Check if slot is available
    const slotBookings = getBookingsForTimeSlot(timeSlot)
    // You can add logic here to check max bookings per slot if needed
    // For now, just set the time and show create dialog
  }

  const handleTimeSlotDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTimeSlot(timeSlot)
  }

  const handleTimeSlotDrop = async (e: React.DragEvent, targetTimeSlot: string) => {
    e.preventDefault()
    setDragOverTimeSlot(null)

    if (!draggedTimeBooking) return

    // If dropped on the same time slot, do nothing
    const normalizeTime = (time: string) => time.split(':').slice(0, 2).join(':')
    if (normalizeTime(draggedTimeBooking.appointment_time) === normalizeTime(targetTimeSlot)) {
      setDraggedTimeBooking(null)
      return
    }

    setIsMoving(true)
    try {
      const response = await fetch(`/api/bookings/${draggedTimeBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_time: targetTimeSlot,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to move booking")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("Error moving booking:", error)
      alert("Failed to move booking")
    } finally {
      setIsMoving(false)
      setDraggedTimeBooking(null)
    }
  }

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedTime || !newBooking.user_name || !newBooking.user_email) {
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          user_name: newBooking.user_name,
          user_email: newBooking.user_email,
          user_phone: newBooking.user_phone || null,
          notes: newBooking.notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to create booking")
        return
      }

      setNewBooking({
        user_name: "",
        user_email: "",
        user_phone: "",
        notes: "",
        status: "pending",
      })
      setSelectedTime("")
      // Refresh available slots
      await fetchAvailableSlots(selectedDate)
      router.refresh()
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Failed to create booking")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedBooking(booking)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", booking.id)
  }

  const handleTimeSlotDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedTimeBooking(booking)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", booking.id)
    e.stopPropagation()
  }

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverDate(dateStr)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault()
    setDragOverDate(null)

    if (!draggedBooking) return

    // If dropped on the same date, do nothing
    if (draggedBooking.appointment_date === targetDate) {
      setDraggedBooking(null)
      return
    }

    setIsMoving(true)
    try {
      // Move booking to new date (keep same time)
      const response = await fetch(`/api/bookings/${draggedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: targetDate,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to move booking")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("Error moving booking:", error)
      alert("Failed to move booking")
    } finally {
      setIsMoving(false)
      setDraggedBooking(null)
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  }

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              {t.booking.bookings} {t.booking.calendarView}
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
          <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
            {t.booking.calendarView}: {t.booking.clickToCreate || "Click on a day to create a booking, drag bookings to move them"}
          </div>
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
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayBookings = getBookingsForDate(day)
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()
              const isDragOver = dragOverDate === dateStr

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`min-h-[80px] sm:min-h-[120px] cursor-pointer rounded-lg border p-1 sm:p-2 transition-all ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  } ${isDragOver ? "border-primary bg-primary/10 ring-2 ring-primary" : ""} ${
                    dayBookings.length > 0 ? "hover:border-primary" : "hover:bg-accent"
                  }`}
                >
                  <div className={`mb-1 text-xs sm:text-sm font-semibold flex items-center justify-between ${isToday ? "text-primary" : ""}`}>
                    <span>{day}</span>
                    {dayBookings.length === 0 && (
                      <Plus className="h-3 w-3 opacity-50" />
                    )}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, booking)}
                        className={`group rounded border px-0.5 sm:px-1 py-0.5 text-[10px] sm:text-xs cursor-move flex items-center gap-1 ${
                          statusColors[booking.status as keyof typeof statusColors] || statusColors.pending
                        } ${draggedBooking?.id === booking.id ? "opacity-50" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-2 w-2 sm:h-3 sm:w-3 opacity-50 group-hover:opacity-100" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{booking.appointment_time}</div>
                          <div className="truncate hidden sm:block">{booking.user_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-xs sm:text-sm">{t.booking.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-xs sm:text-sm">{t.booking.confirmed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm">{t.booking.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm">{t.booking.cancelled}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Dialog */}
      <Dialog open={isTimetableDialogOpen} onOpenChange={(open) => {
        setIsTimetableDialogOpen(open)
        if (!open) {
          setSelectedTime("")
          setNewBooking({
            user_name: "",
            user_email: "",
            user_phone: "",
            notes: "",
            status: "pending",
          })
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.booking.bookings} - {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
              {t.booking.clickToCreate || "Click on a time slot to create a booking, drag bookings to move them"}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSlots ? (
            <div className="py-8 text-center text-muted-foreground">{t.booking.loadingSlots}</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {availableSlots.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t.booking.noSlots || "No available time slots"}
                </div>
              ) : (
                availableSlots.map((slot) => {
                  const slotBookings = getBookingsForTimeSlot(slot)
                  const isDragOver = dragOverTimeSlot === slot
                  const isAvailable = slotBookings.length === 0

                  return (
                    <div
                      key={slot}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedTime(slot)
                        }
                      }}
                      onDragOver={(e) => handleTimeSlotDragOver(e, slot)}
                      onDragLeave={() => setDragOverTimeSlot(null)}
                      onDrop={(e) => handleTimeSlotDrop(e, slot)}
                      className={`min-h-[60px] rounded-lg border p-3 transition-all ${
                        isDragOver ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border"
                      } ${isAvailable ? "hover:bg-accent hover:border-primary cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg min-w-[80px]">{slot}</div>
                          {isAvailable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTime(slot)
                              }}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {t.booking.book}
                            </Button>
                          )}
                        </div>
                        <div className="flex-1 flex flex-wrap gap-2 ml-4">
                          {slotBookings.map((booking) => (
                            <div
                              key={booking.id}
                              draggable
                              onDragStart={(e) => handleTimeSlotDragStart(e, booking)}
                              className={`group rounded border px-2 py-1 text-sm cursor-move flex items-center gap-2 ${
                                statusColors[booking.status as keyof typeof statusColors] || statusColors.pending
                              } ${draggedTimeBooking?.id === booking.id ? "opacity-50" : ""}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{booking.user_name}</div>
                                <div className="text-xs truncate">{booking.user_email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Create Booking Form (shown when time slot is selected) */}
          {selectedTime && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-semibold">
                {t.booking.createBookingFor || "Create booking for"} {selectedTime}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t.booking.name} *</Label>
                  <Input
                    id="name"
                    value={newBooking.user_name}
                    onChange={(e) => setNewBooking({ ...newBooking, user_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t.booking.email} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newBooking.user_email}
                    onChange={(e) => setNewBooking({ ...newBooking, user_email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t.booking.phoneOptional}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newBooking.user_phone}
                    onChange={(e) => setNewBooking({ ...newBooking, user_phone: e.target.value })}
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">{t.booking.status || "Status"}</Label>
                  <Select value={newBooking.status} onValueChange={(value) => setNewBooking({ ...newBooking, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t.booking.pending}</SelectItem>
                      <SelectItem value="confirmed">{t.booking.confirmed}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="notes">{t.booking.notes}</Label>
                  <Textarea
                    id="notes"
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    placeholder={t.booking.notes}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedTime("")
                  setNewBooking({
                    user_name: "",
                    user_email: "",
                    user_phone: "",
                    notes: "",
                    status: "pending",
                  })
                }}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleCreateBooking} disabled={isCreating || !newBooking.user_name || !newBooking.user_email}>
                  {isCreating ? t.common.loading : t.booking.book}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

