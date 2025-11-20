import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const body = await request.json()
  const { 
    name, 
    email, 
    phone, 
    address,
    latitude,
    longitude,
    owner_id, 
    price_range,
    country,
    business_name,
    vat_number,
    registration_number,
    business_address,
    business_type,
    vat_validated,
    expertise,
    profile_image,
    gallery_images,
    bio,
    description,
    social_media,
    booking_preferences,
  } = body

  // Validate required fields
  if (!name || !email || !address) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, and address are required" },
      { status: 400 }
    )
  }

  // Validate EU business details if country is EU
  const EU_COUNTRIES = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]
  const isEUCountry = country && EU_COUNTRIES.includes(country)
  
  if (isEUCountry) {
    if (!business_name || !vat_number || !registration_number || !business_address) {
      return NextResponse.json(
        { error: "EU businesses must provide: business name, VAT number, registration number, and business address" },
        { status: 400 }
      )
    }
  }

  // If owner_id is provided, verify the user exists
  if (owner_id) {
    const { data: owner } = await supabase.from("users").select("id").eq("id", owner_id).maybeSingle()
    if (!owner) {
      return NextResponse.json({ error: "Invalid owner_id: user not found" }, { status: 400 })
    }
  }

  // Update the shop
  const { data: shop, error } = await supabase
    .from("repair_shops")
    .update({
      name,
      email,
      phone: phone || null,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      owner_id: owner_id || null,
      price_range: price_range || "$$",
      business_country: country || null,
      business_name: business_name || null,
      vat_number: vat_number || null,
      company_registration: registration_number || null,
      business_address: business_address || null,
      business_type: business_type || null,
      vat_validated: vat_validated || false,
      expertise: expertise || [],
      profile_image: profile_image || null,
      gallery_images: gallery_images || [],
      bio: bio || null,
      description: description || null,
      social_media: social_media || {},
      booking_preferences: booking_preferences || {
        max_bookings_per_day: 10,
        max_bookings_per_slot: 1,
        working_hours: { start: "09:00", end: "17:00" },
        slot_duration_minutes: 30,
        buffer_time_minutes: 15,
        advance_booking_days: 30,
        same_day_booking_allowed: true,
        auto_confirm: false,
        require_phone: false,
      },
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ shop }, { status: 200 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const { error } = await supabase
    .from("repair_shops")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
