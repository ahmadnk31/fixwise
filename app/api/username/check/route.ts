import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Validate username format (alphanumeric, underscore, hyphen, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens",
      })
    }

    // Check if username exists
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error("Error checking username:", error)
      return NextResponse.json({ error: "Failed to check username" }, { status: 500 })
    }

    return NextResponse.json({
      available: !data,
      valid: true,
      username: username.toLowerCase(),
    })
  } catch (error) {
    console.error("Error in username check:", error)
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 })
  }
}

