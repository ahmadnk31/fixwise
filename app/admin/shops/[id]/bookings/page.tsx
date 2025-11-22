import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookingsPageHeader } from "@/components/bookings-page-header"
import { BookingsPageStats } from "@/components/bookings-page-stats"
import { BookingsPageTabs } from "@/components/bookings-page-tabs"
import { InteractiveBookingsCalendar } from "@/components/interactive-bookings-calendar"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminShopBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/admin")
  }

  // Get shop by ID (admin can access any shop)
  const { data: shop, error: shopError } = await supabase
    .from("repair_shops")
    .select("*")
    .eq("id", id)
    .single()

  if (shopError || !shop) {
    redirect("/admin")
  }

  // Fetch bookings for the shop
  const { data: bookings = [] } = await supabase
    .from("bookings")
    .select("*")
    .eq("shop_id", shop.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  const total = bookings.length
  const pending = bookings.filter((b) => b.status === "pending").length
  const confirmed = bookings.filter((b) => b.status === "confirmed").length
  const completed = bookings.filter((b) => b.status === "completed").length

  // Fetch shop booking preferences
  const bookingPrefs = shop.booking_preferences || {
    working_hours: { start: "09:00", end: "17:00" },
    slot_duration_minutes: 30,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bookings - {shop.name}</h1>
            <p className="text-muted-foreground">View and manage bookings for this shop</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        <BookingsPageHeader shopName={shop.name} />
        <BookingsPageStats total={total} pending={pending} confirmed={confirmed} completed={completed} />
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
    </div>
  )
}

