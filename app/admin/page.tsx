import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
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

  const { data: shops = [] } = await supabase
    .from("repair_shops")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: users = [] } = await supabase
    .from("users")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false })

  const { data: bookings = [] } = await supabase
    .from("bookings")
    .select("id, shop_id, status, appointment_date, appointment_time, user_name, user_email, created_at")
    .order("created_at", { ascending: false })

  const { data: diagnoses = [] } = await supabase
    .from("diagnoses")
    .select("id, user_id, user_input, estimated_cost, created_at")
    .order("created_at", { ascending: false })

  const stats = {
    shops: shops.length,
    users: users.length,
    bookings: bookings.length,
    diagnoses: diagnoses.length,
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <AdminDashboard stats={stats} shops={shops} users={users} bookings={bookings} diagnoses={diagnoses} />
    </div>
  )
}

