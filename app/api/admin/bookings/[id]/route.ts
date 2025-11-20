import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"]

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const status = body?.status as string | undefined

  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status supplied." }, { status: 400 })
  }

  const { error } = await supabase.from("bookings").update({ status }).eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

