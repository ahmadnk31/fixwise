import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const inStock = formData.get("inStock") === "true"
    const image = formData.get("image") as File | null
    const existingImageUrl = formData.get("existingImageUrl") as string

    let imageUrl = existingImageUrl

    // Upload new image if provided
    if (image && image.size > 0) {
      // Delete old image from Supabase Storage if exists
      if (existingImageUrl) {
        try {
          // Only delete if it's a Supabase Storage URL
          if (existingImageUrl.includes("/product-images/")) {
            // Extract file path from URL
            const urlParts = existingImageUrl.split("/product-images/")
            if (urlParts.length > 1) {
              const filePath = `products/${urlParts[1].split("?")[0]}` // Remove query params
              await supabase.storage.from("product-images").remove([filePath])
            }
          }
          // If it's a Vercel Blob URL, we can't delete it, but that's okay
        } catch (e) {
          console.error("[v0] Error deleting old image:", e)
        }
      }

      // Upload new image to Supabase Storage
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
      .update({
        name,
        description,
        category,
        type,
        price: price ? parseFloat(price) : null,
        in_stock: inStock,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get product to delete image
    const { data: product } = await supabase.from("shop_products").select("image_url").eq("id", params.id).single()

    // Delete image from Supabase Storage
    if (product?.image_url) {
      try {
        // Only delete if it's a Supabase Storage URL
        if (product.image_url.includes("/product-images/")) {
          // Extract file path from URL
          const urlParts = product.image_url.split("/product-images/")
          if (urlParts.length > 1) {
            const filePath = `products/${urlParts[1].split("?")[0]}` // Remove query params
            await supabase.storage.from("product-images").remove([filePath])
          }
        }
        // If it's a Vercel Blob URL, we can't delete it, but that's okay
      } catch (e) {
        console.error("[v0] Error deleting image:", e)
      }
    }

    const { error } = await supabase.from("shop_products").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
