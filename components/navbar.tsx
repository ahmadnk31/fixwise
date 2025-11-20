import { createClient } from "@/lib/supabase/server"
import { NavbarClient } from "./navbar-client"

interface NavbarProps {
  variant?: "default" | "minimal"
  showBackButton?: boolean
}

export async function Navbar({ variant = "default", showBackButton = false }: NavbarProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user
  
  // Check if user is a shop owner or admin
  let isShopOwner = false
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    isAdmin = profile?.role === "admin"

    const { data: shop } = await supabase
      .from("repair_shops")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
    isShopOwner = !!shop
  }

  return (
    <NavbarClient 
      variant={variant} 
      showBackButton={showBackButton}
      isLoggedIn={isLoggedIn}
      isShopOwner={isShopOwner}
      isAdmin={isAdmin}
    />
  )
}

