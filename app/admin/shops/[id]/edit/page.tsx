import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShopForm } from "@/components/admin-shop-form"

export default async function EditShopPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

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

  const { data: shop } = await supabase
    .from("repair_shops")
    .select("*")
    .eq("id", id)
    .single()

  if (!shop) {
    notFound()
  }

  const { data: users = [] } = await supabase
    .from("users")
    .select("id, name, email, role")
    .order("created_at", { ascending: false })

  return <AdminShopForm shop={shop} users={users} mode="edit" />
}

