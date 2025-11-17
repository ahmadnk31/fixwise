import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get("shopId")

  try {
    let query = supabase.from("shop_products").select("*").order("created_at", { ascending: false })

    if (shopId) {
      query = query.eq("shop_id", shopId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ products: data })
  } catch (error: any) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const type = formData.get("type") as string
    const price = formData.get("price") as string
    const shopId = formData.get("shopId") as string
    const image = formData.get("image") as File | null

    let imageUrl = null

    // Upload image to Supabase Storage if provided
    if (image && image.size > 0) {
      const fileExt = image.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, image, {
          contentType: image.type,
          cacheControl: "3600",
        })

      if (uploadError) {
        console.error("Image upload error:", uploadError)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath)
        imageUrl = publicUrl
      }
    }

    const { data, error } = await supabase
      .from("shop_products")
      .insert({
        shop_id: shopId,
        name,
        description,
        category,
        type,
        price: price ? parseFloat(price) : null,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
