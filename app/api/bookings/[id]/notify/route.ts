import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { sendBookingStatusUpdateEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch booking with shop details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        shop:repair_shops (
          id,
          name,
          email,
          phone,
          address,
          owner_id
        )
      `
      )
      .eq("id", id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Verify user is the shop owner
    if (booking.shop.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Send notification email
    await sendBookingStatusUpdateEmail({
      bookingId: booking.id,
      userName: booking.user_name,
      userEmail: booking.user_email,
      shopName: booking.shop.name,
      shopEmail: booking.shop.email,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      status: booking.status as "pending" | "confirmed" | "completed" | "cancelled",
      notes: booking.notes,
      shopAddress: booking.shop.address,
      shopPhone: booking.shop.phone,
    })

    return NextResponse.json({
      success: true,
      message: "Notification email sent successfully",
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}

