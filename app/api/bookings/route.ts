import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get("shop_id")
    const userId = searchParams.get("user_id")

    let query = supabase
      .from("bookings")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })

    if (shopId) {
      query = query.eq("shop_id", shopId)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)
  
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

// Helper function to find alternative time slots
function findAlternativeSlots(
  requestedTime: string,
  bookedSlots: string[],
  allSlots: string[],
  bufferMinutes: number
): string[] {
  const alternatives: string[] = []
  const [reqHour, reqMin] = requestedTime.split(":").map(Number)
  const reqMinutes = reqHour * 60 + reqMin
  
  // Check slots before and after the requested time
  for (const slot of allSlots) {
    if (bookedSlots.includes(slot)) continue
    
    const [slotHour, slotMin] = slot.split(":").map(Number)
    const slotMinutes = slotHour * 60 + slotMin
    const diff = Math.abs(slotMinutes - reqMinutes)
    
    // Only suggest slots within 2 hours and respecting buffer time
    if (diff >= bufferMinutes && diff <= 120) {
      alternatives.push(slot)
    }
  }
  
  // Sort by proximity to requested time
  return alternatives.sort((a, b) => {
    const [aHour, aMin] = a.split(":").map(Number)
    const [bHour, bMin] = b.split(":").map(Number)
    const aMinutes = aHour * 60 + aMin
    const bMinutes = bHour * 60 + bMin
    return Math.abs(aMinutes - reqMinutes) - Math.abs(bMinutes - reqMinutes)
  }).slice(0, 3) // Return top 3 alternatives
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { shop_id, diagnosis_id, appointment_date, appointment_time, notes, user_name, user_email, user_phone } = body

    // Validate required fields
    if (!shop_id || !appointment_date || !appointment_time || !user_name || !user_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if user already has a booking at the same time slot
    if (user?.id) {
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id, appointment_date, appointment_time, shop_id")
        .eq("user_id", user.id)
        .eq("appointment_date", appointment_date)
        .eq("appointment_time", appointment_time)
        .in("status", ["pending", "confirmed"])
        .maybeSingle()

      if (existingBooking) {
        return NextResponse.json(
          {
            error: "You already have an appointment at this time slot. Please choose a different time.",
          },
          { status: 409 } // 409 Conflict
        )
      }
    }

    // Also check by email if user is not authenticated
    if (!user?.id) {
      const { data: existingBookingByEmail } = await supabase
        .from("bookings")
        .select("id, appointment_date, appointment_time")
        .eq("user_email", user_email)
        .eq("appointment_date", appointment_date)
        .eq("appointment_time", appointment_time)
        .in("status", ["pending", "confirmed"])
        .maybeSingle()

      if (existingBookingByEmail) {
        return NextResponse.json(
          {
            error: "You already have an appointment at this time slot. Please choose a different time.",
          },
          { status: 409 } // 409 Conflict
        )
      }
    }

    // Fetch shop with booking preferences
    const { data: shop, error: shopError } = await supabase
      .from("repair_shops")
      .select("id, booking_preferences")
      .eq("id", shop_id)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    // Get booking preferences with defaults
    const prefs = shop.booking_preferences || {
      max_bookings_per_day: 10,
      max_bookings_per_slot: 1,
      working_hours: { start: "09:00", end: "17:00" },
      slot_duration_minutes: 30,
      buffer_time_minutes: 15,
      advance_booking_days: 30,
      same_day_booking_allowed: true,
      auto_confirm: false,
      require_phone: false,
    }

    // Validate same-day booking
    const today = new Date().toISOString().split("T")[0]
    if (appointment_date === today && !prefs.same_day_booking_allowed) {
      return NextResponse.json(
        { error: "Same-day bookings are not allowed. Please book for a future date." },
        { status: 400 }
      )
    }

    // Validate advance booking limit
    const appointmentDate = new Date(appointment_date)
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + (prefs.advance_booking_days || 30))
    if (appointmentDate > maxDate) {
      return NextResponse.json(
        { error: `Bookings can only be made up to ${prefs.advance_booking_days} days in advance.` },
        { status: 400 }
      )
    }

    // Validate working hours
    const [workStart, workEnd] = [prefs.working_hours?.start || "09:00", prefs.working_hours?.end || "17:00"]
    if (appointment_time < workStart || appointment_time >= workEnd) {
      return NextResponse.json(
        { error: `Bookings are only available between ${workStart} and ${workEnd}.` },
        { status: 400 }
      )
    }

    // Check total bookings for the day
    const { data: dayBookings, error: dayBookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("shop_id", shop_id)
      .eq("appointment_date", appointment_date)
      .in("status", ["pending", "confirmed"])

    if (dayBookingsError) {
      console.error("Error checking day bookings:", dayBookingsError)
    }

    const bookingsCount = dayBookings?.length || 0
    if (bookingsCount >= (prefs.max_bookings_per_day || 10)) {
      // Find alternative dates
      const { data: upcomingBookings } = await supabase
        .from("bookings")
        .select("appointment_date")
        .eq("shop_id", shop_id)
        .gte("appointment_date", appointment_date)
        .in("status", ["pending", "confirmed"])
        .order("appointment_date", { ascending: true })
        .limit(10)

      const bookedDates = new Set(upcomingBookings?.map((b: any) => b.appointment_date) || [])
      const alternativeDates: string[] = []
      let checkDate = new Date(appointment_date)
      
      for (let i = 0; i < 7 && alternativeDates.length < 3; i++) {
        checkDate.setDate(checkDate.getDate() + 1)
        const dateStr = checkDate.toISOString().split("T")[0]
        if (!bookedDates.has(dateStr)) {
          alternativeDates.push(dateStr)
        }
      }

      return NextResponse.json(
        {
          error: `This shop has reached its daily booking limit (${prefs.max_bookings_per_day} bookings/day).`,
          alternativeDates: alternativeDates.length > 0 ? alternativeDates : undefined,
        },
        { status: 400 }
      )
    }

    // Check bookings for the specific time slot
    const { data: slotBookings, error: slotBookingsError } = await supabase
      .from("bookings")
      .select("id, appointment_time")
      .eq("shop_id", shop_id)
      .eq("appointment_date", appointment_date)
      .in("status", ["pending", "confirmed"])

    if (slotBookingsError) {
      console.error("Error checking slot bookings:", slotBookingsError)
    }

    const slotBookingsCount = slotBookings?.filter((b: any) => b.appointment_time === appointment_time).length || 0
    if (slotBookingsCount >= (prefs.max_bookings_per_slot || 1)) {
      // Find alternative time slots
      const allSlots = generateTimeSlots(workStart, workEnd, prefs.slot_duration_minutes || 30)
      const bookedSlots = slotBookings?.map((b: any) => b.appointment_time) || []
      const alternatives = findAlternativeSlots(
        appointment_time,
        bookedSlots,
        allSlots,
        prefs.buffer_time_minutes || 15
      )

      return NextResponse.json(
        {
          error: "This time slot is already fully booked.",
          alternativeTimes: alternatives.length > 0 ? alternatives : undefined,
        },
        { status: 400 }
      )
    }

    // Validate phone requirement
    if (prefs.require_phone && !user_phone) {
      return NextResponse.json(
        { error: "Phone number is required for booking with this shop." },
        { status: 400 }
      )
    }

    // Final check right before inserting to prevent race conditions
    const { data: finalCheckBookings } = await supabase
      .from("bookings")
      .select("id, appointment_time")
      .eq("shop_id", shop_id)
      .eq("appointment_date", appointment_date)
      .eq("appointment_time", appointment_time)
      .in("status", ["pending", "confirmed"])

    const finalSlotCount = finalCheckBookings?.length || 0
    if (finalSlotCount >= (prefs.max_bookings_per_slot || 1)) {
      // Find alternative time slots
      const allSlots = generateTimeSlots(workStart, workEnd, prefs.slot_duration_minutes || 30)
      const bookedSlots = finalCheckBookings?.map((b: any) => b.appointment_time) || []
      const alternatives = findAlternativeSlots(
        appointment_time,
        bookedSlots,
        allSlots,
        prefs.buffer_time_minutes || 15
      )

      return NextResponse.json(
        {
          error: "This time slot was just booked by someone else. Please select another time.",
          alternativeTimes: alternatives.length > 0 ? alternatives : undefined,
        },
        { status: 409 } // 409 Conflict
      )
    }

    // Fetch shop details for email
    const { data: shopDetails } = await supabase
      .from("repair_shops")
      .select("name, email, phone, address")
      .eq("id", shop_id)
      .single()

    // Create booking
    const bookingStatus = prefs.auto_confirm ? "confirmed" : "pending"
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        shop_id,
        diagnosis_id: diagnosis_id || null,
        user_id: user?.id || null,
        appointment_date,
        appointment_time,
        notes,
        user_name,
        user_email,
        user_phone,
        status: bookingStatus,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      throw error
    }

    // Send email notification (async, don't wait for it)
    sendBookingConfirmationEmail({
      bookingId: booking.id,
      userName: user_name,
      userEmail: user_email,
      shopName: shopDetails?.name || "Repair Shop",
      shopEmail: shopDetails?.email,
      shopAddress: shopDetails?.address,
      shopPhone: shopDetails?.phone,
      appointmentDate: appointment_date,
      appointmentTime: appointment_time,
      status: bookingStatus,
      notes: notes || null,
    }).catch((err) => {
      console.error("Failed to send booking email:", err)
    })

    return NextResponse.json({
      booking,
      message: bookingStatus === "confirmed" 
        ? "Booking confirmed automatically based on shop preferences."
        : "Booking created successfully. Waiting for shop confirmation.",
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
