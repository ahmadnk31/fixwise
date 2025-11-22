import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get("shop_id")
    const date = searchParams.get("date")

    if (!shopId || !date) {
      return NextResponse.json({ error: "shop_id and date are required" }, { status: 400 })
    }

    // Fetch shop with booking preferences
    const { data: shop, error: shopError } = await supabase
      .from("repair_shops")
      .select("id, booking_preferences")
      .eq("id", shopId)
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
    }

    // Check if date is valid
    const today = new Date().toISOString().split("T")[0]
    if (date === today && !prefs.same_day_booking_allowed) {
      return NextResponse.json({ availableSlots: [], message: "Same-day bookings are not allowed" })
    }

    // Check daily booking limit
    const { data: dayBookings } = await supabase
      .from("bookings")
      .select("appointment_time")
      .eq("shop_id", shopId)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"])

    const bookingsCount = dayBookings?.length || 0
    if (bookingsCount >= (prefs.max_bookings_per_day || 10)) {
      return NextResponse.json({ availableSlots: [], message: "Daily booking limit reached" })
    }

    // Generate all time slots
    const workStart = prefs.working_hours?.start || "09:00"
    const workEnd = prefs.working_hours?.end || "17:00"
    const slotDuration = prefs.slot_duration_minutes || 30
    const allSlots = generateTimeSlots(workStart, workEnd, slotDuration)

    // Get booked slots
    const bookedSlots = dayBookings?.map((b: any) => b.appointment_time) || []
    const maxPerSlot = prefs.max_bookings_per_slot || 1

    // Count bookings per slot
    const slotCounts: Record<string, number> = {}
    bookedSlots.forEach((slot: string) => {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1
    })

    // Filter available slots
    const availableSlots = allSlots.filter((slot) => {
      const count = slotCounts[slot] || 0
      return count < maxPerSlot
    })

    return NextResponse.json({
      availableSlots,
      totalSlots: allSlots.length,
      bookedSlots: bookedSlots.length,
      availableCount: availableSlots.length,
      dailyLimit: prefs.max_bookings_per_day,
      remainingDailyCapacity: (prefs.max_bookings_per_day || 10) - bookingsCount,
      advance_booking_days: prefs.advance_booking_days,
      same_day_booking_allowed: prefs.same_day_booking_allowed,
      require_phone: prefs.require_phone || false,
      workingHours: prefs.working_hours || { start: "09:00", end: "17:00" },
      slotDuration: prefs.slot_duration_minutes || 30,
      maxBookingsPerSlot: prefs.max_bookings_per_slot || 1,
      deliveryPricing: prefs.delivery_pricing || {
        pickup: 0,
        home: 15,
        mail: 25,
      },
    })
  } catch (error) {
    console.error("Error fetching available slots:", error)
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 })
  }
}

