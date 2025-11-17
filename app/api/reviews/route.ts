import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get("shop_id")

    if (!shopId) {
      return NextResponse.json({ error: "shop_id is required" }, { status: 400 })
    }

    // Fetch reviews with user information
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:users(name, email)
      `,
      )
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shop_id, rating, comment, photos } = body

    // Validate required fields
    if (!shop_id || !rating) {
      return NextResponse.json({ error: "shop_id and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if user already reviewed this shop
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("shop_id", shop_id)
      .eq("user_id", user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this shop" }, { status: 400 })
    }

    // Create review
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        shop_id,
        user_id: user.id,
        rating,
        comment,
        photos: photos || [],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
