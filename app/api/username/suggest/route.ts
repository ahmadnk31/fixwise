import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function generateUsernameSuggestions(base: string, existingUsernames: Set<string>): string[] {
  const suggestions: string[] = []
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)
  
  if (!cleanBase) return []

  // Try base name
  if (!existingUsernames.has(cleanBase) && cleanBase.length >= 3) {
    suggestions.push(cleanBase)
  }

  // Try with numbers
  for (let i = 1; i <= 999 && suggestions.length < 5; i++) {
    const candidate = `${cleanBase}${i}`
    if (!existingUsernames.has(candidate) && candidate.length <= 30) {
      suggestions.push(candidate)
    }
  }

  // Try with random suffix
  const randomSuffixes = ["2024", "pro", "user", "shop", "repair"]
  for (const suffix of randomSuffixes) {
    if (suggestions.length >= 5) break
    const candidate = `${cleanBase}${suffix}`
    if (!existingUsernames.has(candidate) && candidate.length <= 30) {
      suggestions.push(candidate)
    }
  }

  return suggestions.slice(0, 5)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { name, email, shopName } = body

    if (!name && !email && !shopName) {
      return NextResponse.json({ error: "At least one field (name, email, or shopName) is required" }, { status: 400 })
    }

    // Get base strings for suggestions
    const bases: string[] = []
    
    if (name) {
      const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 0)
      bases.push(...nameParts)
      if (nameParts.length > 1) {
        bases.push(nameParts[0] + nameParts[nameParts.length - 1])
      }
    }
    
    if (email) {
      const emailBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      if (emailBase) bases.push(emailBase)
    }
    
    if (shopName) {
      const shopBase = shopName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)
      if (shopBase) bases.push(shopBase)
    }

    // Get all existing usernames that start with our bases
    const allSuggestions: string[] = []
    const checkedUsernames = new Set<string>()

    for (const base of bases) {
      if (base.length < 3) continue
      
      // Check existing usernames that start with this base
      const { data: existing } = await supabase
        .from("users")
        .select("username")
        .not("username", "is", null)
        .ilike("username", `${base}%`)
        .limit(100)

      if (existing) {
        existing.forEach((u: { username: string }) => {
          if (u.username) checkedUsernames.add(u.username.toLowerCase())
        })
      }

      // Generate suggestions for this base
      const baseSuggestions = generateUsernameSuggestions(base, checkedUsernames)
      allSuggestions.push(...baseSuggestions)
    }

    // Remove duplicates and limit to 5
    const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 5)

    return NextResponse.json({ suggestions: uniqueSuggestions })
  } catch (error) {
    console.error("Error generating username suggestions:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}

