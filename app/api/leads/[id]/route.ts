import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()

    if (!status || !["pending", "accepted", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the shop for this lead
    const { data: lead } = await supabase.from("leads").select("shop_id").eq("id", id).single()

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const { data: shop } = await supabase.from("repair_shops").select("owner_id").eq("id", lead.shop_id).single()

    if (!shop || shop.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update lead status
    const { data, error } = await supabase.from("leads").update({ status }).eq("id", id).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error("Lead update error:", error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}
