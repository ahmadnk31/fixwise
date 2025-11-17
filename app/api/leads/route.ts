import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { diagnosisId, shopId } = await req.json()

    console.log("[v0] Creating lead - diagnosisId:", diagnosisId, "shopId:", shopId)

    if (!diagnosisId || !shopId) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const [diagnosisCheck, shopCheck] = await Promise.all([
      supabase.from("diagnoses").select("id").eq("id", diagnosisId).single(),
      supabase.from("repair_shops").select("id").eq("id", shopId).single(),
    ])

    console.log("[v0] Diagnosis check:", diagnosisCheck)
    console.log("[v0] Shop check:", shopCheck)

    if (diagnosisCheck.error) {
      console.log("[v0] Diagnosis not found")
      return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 })
    }

    if (shopCheck.error) {
      console.log("[v0] Shop not found")
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    // Create a lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        diagnosis_id: diagnosisId,
        shop_id: shopId,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error creating lead:", error)
      return NextResponse.json({ error: "Failed to create lead", details: error.message }, { status: 500 })
    }

    console.log("[v0] Lead created successfully:", data.id)
    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error("[v0] Lead creation error:", error)
    return NextResponse.json(
      { error: "Failed to create lead", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
