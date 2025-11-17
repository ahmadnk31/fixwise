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
    const { status, notes } = body

    // Validate status if provided
    if (status && !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
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

    // Update booking (RLS will ensure proper permissions)
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
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
