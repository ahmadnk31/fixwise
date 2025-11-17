"use client"

import type { Booking } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface BookingListProps {
  bookings: Booking[]
  isShopOwner?: boolean
}

export function BookingList({ bookings, isShopOwner = false }: BookingListProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{isShopOwner ? booking.user_name : booking.shop?.name}</CardTitle>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(booking.appointment_date), "PPP")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {booking.appointment_time}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isShopOwner ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.user_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${booking.user_email}`} className="hover:underline">
                    {booking.user_email}
                  </a>
                </div>
                {booking.user_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${booking.user_phone}`} className="hover:underline">
                      {booking.user_phone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              booking.shop && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                  <span>{booking.shop.address}</span>
                </div>
              )
            )}

            {booking.notes && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Notes:</p>
                <p className="mt-1 text-muted-foreground">{booking.notes}</p>
              </div>
            )}

            {isShopOwner && booking.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                  disabled={updatingId === booking.id}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                  disabled={updatingId === booking.id}
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
