import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { BookingsPageHeader } from "@/components/bookings-page-header"
import { BookingsPageStats } from "@/components/bookings-page-stats"
import { BookingsPageTabs } from "@/components/bookings-page-tabs"
import { SetupShopPrompt } from "@/components/setup-shop-prompt"
import { InteractiveBookingsCalendar } from "@/components/interactive-bookings-calendar"

export default async function ShopBookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).maybeSingle()

  if (!shop) {
    return <SetupShopPrompt />
  }

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("shop_id", shop.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  const bookings = bookingsData || []

  const pendingCount = bookings.filter((b) => b.status === "pending").length
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length
  const completedCount = bookings.filter((b) => b.status === "completed").length

  // Fetch shop booking preferences
  const bookingPrefs = shop.booking_preferences || {
    working_hours: { start: "09:00", end: "17:00" },
    slot_duration_minutes: 30,
  }

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
      <BookingsPageHeader />
      <BookingsPageStats 
        total={bookings.length}
        pending={pendingCount}
        confirmed={confirmedCount}
        completed={completedCount}
      />
      <BookingsPageTabs 
        bookings={bookings} 
        shopId={shop.id}
        interactiveCalendar={
          <InteractiveBookingsCalendar
            initialBookings={bookings}
            shopId={shop.id}
            workingHours={bookingPrefs.working_hours}
            slotDuration={bookingPrefs.slot_duration_minutes || 30}
          />
        }
      />
    </div>
  )
}
