import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { sendBookingStatusUpdateEmail, sendBookingConfirmationEmail } from "@/lib/email"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes, appointment_date, appointment_time } = body

    // Validate status if provided
    if (status && !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate date format if provided
    if (appointment_date && !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    // Validate time format if provided
    if (appointment_time && !/^\d{2}:\d{2}$/.test(appointment_time)) {
      return NextResponse.json({ error: "Invalid time format. Use HH:MM" }, { status: 400 })
    }

    // Fetch current booking to get shop details
    const { data: currentBooking } = await supabase
      .from("bookings")
      .select(`
        *,
        shop:repair_shops(name, email, phone, address)
      `)
      .eq("id", id)
      .single()

    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })
    }

    const shopId = (currentBooking as any).shop_id

    // If date/time is being updated, check for conflicts
    if (appointment_date || appointment_time) {
      const newDate = appointment_date || currentBooking.appointment_date
      const newTime = appointment_time || currentBooking.appointment_time

      // Check for existing bookings at the same time slot
      const { data: conflictingBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("shop_id", shopId)
        .eq("appointment_date", newDate)
        .eq("appointment_time", newTime)
        .neq("id", id)

      if (conflictingBookings && conflictingBookings.length > 0) {
        // Check shop preferences for max bookings per slot
        const { data: shop } = await supabase
          .from("repair_shops")
          .select("booking_preferences")
          .eq("id", shopId)
          .single()

        const prefs = shop?.booking_preferences || { max_bookings_per_slot: 1 }
        const maxPerSlot = prefs.max_bookings_per_slot || 1

        if (conflictingBookings.length >= maxPerSlot) {
          return NextResponse.json(
            { error: `This time slot is already full (max ${maxPerSlot} booking${maxPerSlot > 1 ? 's' : ''} per slot)` },
            { status: 400 }
          )
        }
      }
    }

    // Update booking (RLS will ensure proper permissions)
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(appointment_date && { appointment_date }),
        ...(appointment_time && { appointment_time }),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })
    }

    // Send email notification if status changed
    if (status && status !== currentBooking.status) {
      const shop = currentBooking.shop as any
      
      if (status === "pending") {
        // New booking notification
        sendBookingConfirmationEmail({
          bookingId: booking.id,
          userName: booking.user_name,
          userEmail: booking.user_email,
          shopName: shop?.name || "Repair Shop",
          shopEmail: shop?.email,
          shopAddress: shop?.address,
          shopPhone: shop?.phone,
          appointmentDate: booking.appointment_date,
          appointmentTime: booking.appointment_time,
          status: booking.status,
          notes: booking.notes || null,
        }).catch((err) => {
          console.error("Failed to send booking email:", err)
        })
      } else {
        // Status update notification
        sendBookingStatusUpdateEmail({
          bookingId: booking.id,
          userName: booking.user_name,
          userEmail: booking.user_email,
          shopName: shop?.name || "Repair Shop",
          shopEmail: shop?.email,
          shopAddress: shop?.address,
          shopPhone: shop?.phone,
          appointmentDate: booking.appointment_date,
          appointmentTime: booking.appointment_time,
          status: booking.status,
          notes: booking.notes || null,
        }).catch((err) => {
          console.error("Failed to send status update email:", err)
        })
      }
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete booking (RLS will ensure proper permissions)
    const { error } = await supabase.from("bookings").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
  }
}
