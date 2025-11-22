"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BookingForm } from "@/components/booking-form"
import { Calendar } from "lucide-react"

interface BookingDialogProps {
  shopId: string
  shopName: string
  userEmail?: string
  userName?: string
  trigger?: React.ReactNode
}

export function BookingDialog({ shopId, shopName, userEmail, userName, trigger }: BookingDialogProps) {
  const [open, setOpen] = useState(false)

  const handleBookingSuccess = () => {
    // Close dialog after a short delay to show the toast
    setTimeout(() => {
      setOpen(false)
    }, 1500)
  }

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Calendar className="h-4 w-4" />
      <span>Book Appointment</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {defaultTrigger}
        </div>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Schedule your repair service with {shopName}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <BookingForm 
            shopId={shopId} 
            shopName={shopName}
            userEmail={userEmail}
            userName={userName}
            onSuccess={handleBookingSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

