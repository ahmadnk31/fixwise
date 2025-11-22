import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShopDashboard } from "@/components/shop-dashboard"

export default async function AdminShopDashboardPage({
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

  // Get leads for the shop
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

  const leads = leadsData || []

  // Fetch bookings count
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shop.id)

  const bookingsCount = count || 0

  return <ShopDashboard user={user} profile={profile} shop={shop} leads={leads} bookingsCount={bookingsCount} isAdmin={true} />
}

