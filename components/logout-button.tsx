"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"

interface LogoutButtonProps {
  variant?: "icon" | "full"
  className?: string
}

export function LogoutButton({ variant = "icon", className }: LogoutButtonProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (variant === "full") {
    return (
      <Button 
        variant="ghost" 
        className={`w-full justify-start ${className || ""}`}
        onClick={handleLogout} 
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t.nav.logout}
      </Button>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleLogout} 
      disabled={isLoggingOut}
      title={t.nav.logout}
      className={className}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}

