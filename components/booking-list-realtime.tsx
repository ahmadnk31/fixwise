"use client"

import type { Booking } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface BookingListRealtimeProps {
  initialBookings: Booking[]
  isShopOwner?: boolean
  shopId?: string
  userId?: string
}

export function BookingListRealtime({ 
  initialBookings, 
  isShopOwner = false,
  shopId,
  userId 
}: BookingListRealtimeProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Set up real-time subscription
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "bookings",
          filter: shopId ? `shop_id=eq.${shopId}` : userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          console.log("Booking change received:", payload)

          if (payload.eventType === "INSERT") {
            // New booking added
            setBookings((prev) => {
              const newBooking = payload.new as Booking
              // Check if booking already exists (avoid duplicates)
              if (prev.find((b) => b.id === newBooking.id)) {
                return prev
              }
              return [newBooking, ...prev].sort((a, b) => {
                const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`)
                const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`)
                return dateA.getTime() - dateB.getTime()
              })
            })
          } else if (payload.eventType === "UPDATE") {
            // Booking updated
            setBookings((prev) =>
              prev.map((booking) =>
                booking.id === payload.new.id ? (payload.new as Booking) : booking
              )
            )
          } else if (payload.eventType === "DELETE") {
            // Booking deleted
            setBookings((prev) => prev.filter((booking) => booking.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId, userId])

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

      // Real-time update will handle the UI update
      router.refresh()
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Failed to update booking status")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">No bookings found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg break-words">{isShopOwner ? booking.user_name : booking.shop?.name}</CardTitle>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {format(new Date(booking.appointment_date), "PPP")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    {booking.appointment_time}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {isShopOwner ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="break-words">{booking.user_name}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${booking.user_email}`} className="hover:underline truncate text-primary">
                    {booking.user_email}
                  </a>
                </div>
                {booking.user_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${booking.user_phone}`} className="hover:underline text-primary">
                      {booking.user_phone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              booking.shop && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="break-words">{booking.shop.address}</span>
                </div>
              )
            )}

            {booking.notes && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Notes:</p>
                <p className="mt-1 text-muted-foreground break-words">{booking.notes}</p>
              </div>
            )}

            {isShopOwner && booking.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                  disabled={updatingId === booking.id}
                  className="w-full sm:w-auto"
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                  disabled={updatingId === booking.id}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            )}

            {isShopOwner && booking.status === "confirmed" && (
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(booking.id, "completed")}
                disabled={updatingId === booking.id}
                className="w-full sm:w-auto"
              >
                Mark as Completed
              </Button>
            )}

            {!isShopOwner && booking.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                disabled={updatingId === booking.id}
                className="w-full sm:w-auto"
              >
                Cancel Booking
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

