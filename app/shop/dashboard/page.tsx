import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShopDashboard } from "@/components/shop-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "",
        role: user.user_metadata?.role || "user",
      })
      .select()
      .single()

    // Use the newly created profile
    const profileToUse = newProfile
    const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).maybeSingle()

    let leads = []
    let bookingsCount = 0
    if (shop) {
      const { data: leadsData } = await supabase
        .from("leads")
        .select(
          `
        *,
        diagnoses (
          id,
          user_input,
          ai_response,
          estimated_cost,
          created_at
        )
      `,
        )
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false })

      leads = leadsData || []

      // Fetch bookings count
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)

      bookingsCount = count || 0
    }

    return <ShopDashboard user={user} profile={profileToUse} shop={shop} leads={leads} bookingsCount={bookingsCount} />
  }

  const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).maybeSingle()

  // Get leads for the shop
  let leads = []
  let bookingsCount = 0
  if (shop) {
    const { data: leadsData } = await supabase
      .from("leads")
      .select(
        `
        *,
        diagnoses (
          id,
          user_input,
          ai_response,
          estimated_cost,
          created_at
        )
      `,
      )
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false })

    leads = leadsData || []

    // Fetch bookings count
    const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("shop_id", shop.id)

    bookingsCount = count || 0
  }

  return <ShopDashboard user={user} profile={profile} shop={shop} leads={leads} bookingsCount={bookingsCount} />
}
