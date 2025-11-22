import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShopSettings } from "@/components/shop-settings"

export default async function AdminShopSettingsPage({
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

  return <ShopSettings user={user} shop={shop} isAdmin={true} />
}

