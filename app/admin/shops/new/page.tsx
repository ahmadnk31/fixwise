import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShopForm } from "@/components/admin-shop-form"

export default async function NewShopPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const { data: users = [] } = await supabase
    .from("users")
    .select("id, name, email, role")
    .order("created_at", { ascending: false })

  return <AdminShopForm users={users} mode="create" />
}

