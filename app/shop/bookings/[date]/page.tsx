import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TimetablePage } from "@/components/timetable-page"
import { notFound } from "next/navigation"

export default async function BookingsTimetablePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: shop } = await supabase
    .from("repair_shops")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!shop) {
    redirect("/shop/settings")
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    notFound()
  }

  // Fetch bookings for this date
  const { data: bookings = [] } = await supabase
    .from("bookings")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("appointment_date", date)
    .order("appointment_time", { ascending: true })

  // Fetch shop booking preferences
  const bookingPrefs = shop.booking_preferences || {
    working_hours: { start: "09:00", end: "17:00" },
    slot_duration_minutes: 30,
  }

  return (
    <TimetablePage
      date={date}
      initialBookings={bookings ?? []}
      shopId={shop.id}
      workingHours={bookingPrefs.working_hours}
      slotDuration={bookingPrefs.slot_duration_minutes || 30}
    />
  )
}

