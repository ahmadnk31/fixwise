"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Search, 
  Filter,
  Download,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Calendar,
  List
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface Booking {
  id: string
  appointment_date: string
  appointment_time: string
  user_name: string
  user_email: string
  user_phone: string | null
  status: string
  notes: string | null
  created_at: string
}

interface TimetablePageProps {
  date: string
  initialBookings: Booking[]
  shopId: string
  workingHours?: { start: string; end: string }
  slotDuration?: number
}

export function TimetablePage({
  date,
  initialBookings,
  shopId,
  workingHours = { start: "09:00", end: "17:00" },
  slotDuration = 30,
}: TimetablePageProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar")

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Set up real-time subscription
    const channel = supabase
      .channel("timetable-bookings-changes")
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
            if (newBooking.appointment_date === date) {
              setBookings((prev) => {
                if (prev.find((b) => b.id === newBooking.id)) {
                  return prev
                }
                return [...prev, newBooking].sort((a, b) => {
                  const timeA = a.appointment_time.split(':').map(Number)
                  const timeB = b.appointment_time.split(':').map(Number)
                  return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
                })
              })
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedBooking = payload.new as Booking
            if (updatedBooking.appointment_date === date) {
              setBookings((prev) =>
                prev.map((booking) =>
                  booking.id === updatedBooking.id ? updatedBooking : booking
                )
              )
            } else {
              // Booking date changed, remove it
              setBookings((prev) => prev.filter((booking) => booking.id !== updatedBooking.id))
            }
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) => prev.filter((booking) => booking.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId, date])

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update booking")
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Failed to update booking status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSendNotification = async (bookingId: string) => {
    setNotifyingId(bookingId)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/notify`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }

      alert("Notification email sent successfully!")
    } catch (error) {
      console.error("Error sending notification:", error)
      alert("Failed to send notification email")
    } finally {
      setNotifyingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-300"
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-300"
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300"
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.user_phone && booking.user_phone.includes(searchQuery)) ||
      booking.appointment_time.includes(searchQuery)
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const exportToCSV = () => {
    const headers = ["Time", "Customer Name", "Email", "Phone", "Status", "Notes"]
    const rows = filteredBookings.map((booking) => [
      booking.appointment_time,
      booking.user_name,
      booking.user_email,
      booking.user_phone || "",
      booking.status,
      booking.notes || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bookings-${date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: string[] = []
    const [startHour, startMin] = workingHours.start.split(":").map(Number)
    const [endHour, endMin] = workingHours.end.split(":").map(Number)

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`)
      currentMin += slotDuration
      if (currentMin >= 60) {
        currentMin = 0
        currentHour++
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots()

  // Get bookings for a specific time slot
  const getBookingsForSlot = (timeSlot: string) => {
    // Normalize time format (remove seconds if present)
    const normalizeTime = (time: string) => {
      return time.split(':').slice(0, 2).join(':')
    }
    const normalizedSlot = normalizeTime(timeSlot)
    return bookings.filter((b) => normalizeTime(b.appointment_time) === normalizedSlot)
  }

  // Check if current time is in this slot
  const isCurrentTimeSlot = (timeSlot: string) => {
    const isToday = date === format(new Date(), "yyyy-MM-dd")
    if (!isToday) return false

    const [slotHour, slotMin] = timeSlot.split(":").map(Number)
    const currentHour = currentTime.getHours()
    const currentMin = currentTime.getMinutes()

    const slotStart = slotHour * 60 + slotMin
    const slotEnd = slotStart + slotDuration
    const current = currentHour * 60 + currentMin

    return current >= slotStart && current < slotEnd
  }

  // Get current time position for indicator
  const getCurrentTimePosition = () => {
    const isToday = date === format(new Date(), "yyyy-MM-dd")
    if (!isToday) return null

    const currentHour = currentTime.getHours()
    const currentMin = currentTime.getMinutes()
    const current = currentHour * 60 + currentMin

    const [startHour, startMin] = workingHours.start.split(":").map(Number)
    const start = startHour * 60 + startMin
    const [endHour, endMin] = workingHours.end.split(":").map(Number)
    const end = endHour * 60 + endMin

    if (current < start || current >= end) return null

    const totalMinutes = end - start
    const elapsedMinutes = current - start
    return (elapsedMinutes / totalMinutes) * 100
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }

  // Debug: Log bookings to console (remove in production)
  useEffect(() => {
    if (bookings.length > 0) {
      console.log("Bookings data:", bookings)
      console.log("Time slots:", timeSlots)
      console.log("Working hours:", workingHours)
    }
  }, [bookings, timeSlots, workingHours])

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/shop/bookings"
          className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold">Timetable</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">{format(new Date(date), "EEEE, MMMM d, yyyy")}</span>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="mb-6">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="calendar" className="flex-1 sm:flex-initial">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1 sm:flex-initial">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List View</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <div className="relative min-w-full">
                {/* Current time indicator */}
                {getCurrentTimePosition() !== null && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="h-0.5 w-full bg-red-500"></div>
                    <div className="absolute right-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {format(currentTime, "HH:mm")}
                    </div>
                  </div>
                )}

                <div className="divide-y min-w-full">
                  {timeSlots.map((timeSlot, index) => {
                    const slotBookings = getBookingsForSlot(timeSlot)
                    const isCurrent = isCurrentTimeSlot(timeSlot)
                    
                    // Apply filters only if search query or status filter is set
                    const filteredSlotBookings = slotBookings.filter((booking) => {
                      // If no search query and status is "all", show all bookings
                      if (!searchQuery && statusFilter === "all") {
                        return true
                      }
                      
                      const matchesSearch = !searchQuery || 
                        booking.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        booking.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (booking.user_phone && booking.user_phone.includes(searchQuery)) ||
                        booking.appointment_time.includes(searchQuery)
                      
                      const matchesStatus = statusFilter === "all" || booking.status === statusFilter

                      return matchesSearch && matchesStatus
                    })

                    return (
                      <div
                        key={timeSlot}
                        className={`relative min-h-[120px] p-3 sm:p-4 transition-colors ${
                          isCurrent ? "bg-red-50 dark:bg-red-950/20" : "hover:bg-accent/50"
                        } ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                      >
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {/* Time column */}
                          <div className="w-full sm:w-20 flex-shrink-0">
                            <div className={`text-base sm:text-lg font-semibold ${isCurrent ? "text-red-600" : ""}`}>
                              {timeSlot}
                            </div>
                            {isCurrent && (
                              <div className="mt-1 text-xs text-red-600 font-medium">Now</div>
                            )}
                          </div>

                          {/* Bookings column */}
                          <div className="flex-1 space-y-2 min-w-0">
                            {filteredSlotBookings.length === 0 ? (
                              slotBookings.length > 0 ? (
                                <div className="text-xs text-muted-foreground italic">
                                  {slotBookings.length} booking{slotBookings.length > 1 ? 's' : ''} (filtered out)
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic">No bookings</div>
                              )
                            ) : (
                              filteredSlotBookings.map((booking) => (
                                <Card
                                  key={booking.id}
                                  className={`border-l-4 ${
                                    booking.status === "pending"
                                      ? "border-l-yellow-500"
                                      : booking.status === "confirmed"
                                        ? "border-l-green-500"
                                        : booking.status === "completed"
                                          ? "border-l-blue-500"
                                          : "border-l-red-500"
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <span className="font-semibold text-sm sm:text-base break-words">{booking.user_name}</span>
                                          <Badge className={getStatusColor(booking.status)}>
                                            {booking.status}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                          <div className="flex items-center gap-1 break-all">
                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{booking.user_email}</span>
                                          </div>
                                          {booking.user_phone && (
                                            <div className="flex items-center gap-1">
                                              <Phone className="h-3 w-3 flex-shrink-0" />
                                              <a href={`tel:${booking.user_phone}`} className="hover:underline">
                                                {booking.user_phone}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                        {booking.notes && (
                                          <div className="mt-2 text-xs text-muted-foreground break-words">
                                            {booking.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[100px]">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleSendNotification(booking.id)}
                                          disabled={notifyingId === booking.id}
                                          className="h-7 text-xs w-full sm:w-auto"
                                        >
                                          {notifyingId === booking.id ? (
                                            <>
                                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                              Sending...
                                            </>
                                          ) : (
                                            <>
                                              <Send className="h-3 w-3 mr-1" />
                                              Notify
                                            </>
                                          )}
                                        </Button>
                                        {booking.status === "pending" && (
                                          <>
                                            <Button
                                              size="sm"
                                              onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                                              disabled={updatingId === booking.id}
                                              className="h-7 text-xs w-full sm:w-auto"
                                            >
                                              {updatingId === booking.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                "Confirm"
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                                              disabled={updatingId === booking.id}
                                              className="h-7 text-xs w-full sm:w-auto"
                                            >
                                              Cancel
                                            </Button>
                                          </>
                                        )}
                                        {booking.status === "confirmed" && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleUpdateStatus(booking.id, "completed")}
                                            disabled={updatingId === booking.id}
                                            className="h-7 text-xs w-full sm:w-auto"
                                          >
                                            Complete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {bookings.length === 0
                    ? "No bookings for this date"
                    : "No bookings match your search criteria"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        {booking.appointment_time}
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium break-words">{booking.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${booking.user_email}`}
                          className="hover:underline text-primary truncate"
                        >
                          {booking.user_email}
                        </a>
                      </div>
                      {booking.user_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={`tel:${booking.user_phone}`}
                            className="hover:underline text-primary"
                          >
                            {booking.user_phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {booking.notes && (
                      <div className="rounded-lg bg-muted p-3 sm:p-4">
                        <p className="mb-1 text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground break-words">{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendNotification(booking.id)}
                      disabled={notifyingId === booking.id}
                      className="w-full gap-2"
                    >
                      {notifyingId === booking.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Notify Customer
                        </>
                      )}
                    </Button>
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          disabled={updatingId === booking.id}
                          className="w-full gap-2"
                        >
                          {updatingId === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          disabled={updatingId === booking.id}
                          className="w-full gap-2"
                        >
                          {updatingId === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(booking.id, "completed")}
                        disabled={updatingId === booking.id}
                        className="w-full gap-2"
                      >
                        {updatingId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Mark as Completed
                      </Button>
                    )}
                    {(booking.status === "completed" || booking.status === "cancelled") && (
                      <div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                        {booking.status === "completed"
                          ? "This booking has been completed"
                          : "This booking has been cancelled"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

