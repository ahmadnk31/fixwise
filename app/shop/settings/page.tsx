import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShopSettings } from "@/components/shop-settings"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get shop if exists
  const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).single()

  return <ShopSettings user={user} shop={shop} />
}
