import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { LogoutButton } from "./logout-button"
import { LanguageSwitcher } from "./language-switcher"
import { NavbarTranslations } from "./navbar-translations"

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
  
  // Check if user is a shop owner
  let isShopOwner = false
  if (user) {
    const { data: shop } = await supabase
      .from("repair_shops")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
    isShopOwner = !!shop
  }

  if (variant === "minimal") {
    return (
      <header className="absolute top-0 w-full z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="FixWise Logo" 
              width={180} 
              height={60}
              className="h-10 w-auto sm:h-12"
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <NavbarTranslations isLoggedIn={isLoggedIn} isShopOwner={isShopOwner} variant="minimal" showLogoutInMobile={true} />
            {isLoggedIn && (
              <div className="hidden md:block">
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image 
            src="/logo.png" 
            alt="FixWise Logo" 
            width={180} 
            height={60}
            className="h-10 w-auto sm:h-12"
          />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <LanguageSwitcher />
          <NavbarTranslations isLoggedIn={isLoggedIn} isShopOwner={isShopOwner} variant="default" showLogoutInMobile={true} />
          {isLoggedIn && (
            <div className="hidden lg:block">
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

