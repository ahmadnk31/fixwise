"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { LogoutButton } from "./logout-button"
import { ArrowLeft, Menu, X } from "lucide-react"
import { LanguageSwitcher } from "./language-switcher"
import { useContext } from "react"
import { I18nContext } from "@/lib/i18n/context"
import { getTranslations, defaultLocale } from "@/lib/i18n/translations"

interface NavbarClientProps {
  variant?: "default" | "minimal"
  showBackButton?: boolean
  onBack?: () => void
  isLoggedIn?: boolean
  isShopOwner?: boolean
  isAdmin?: boolean
}

export function NavbarClient({ 
  variant = "default", 
  showBackButton = false, 
  onBack,
  isLoggedIn: initialIsLoggedIn,
  isShopOwner: initialIsShopOwner,
  isAdmin: initialIsAdmin
}: NavbarClientProps) {
  // Safely get i18n context with fallback
  const i18nContext = useContext(I18nContext)
  const t = i18nContext?.t || getTranslations(defaultLocale)
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(initialIsLoggedIn === undefined)
  const [isShopOwner, setIsShopOwner] = useState(initialIsShopOwner || false)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin || false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Don't close if clicking the toggle button or inside the menu
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setMobileMenuOpen(false)
    }

    if (mobileMenuOpen) {
      // Use a small delay to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    // If props are provided, use them and skip client-side fetching
    if (initialIsLoggedIn !== undefined) {
      setLoading(false)
      return
    }

    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Check if user is a shop owner
      if (user) {
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
        setIsAdmin(profile?.role === "admin")

        const { data: shop } = await supabase
          .from("repair_shops")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle()
        setIsShopOwner(!!shop)
      } else {
        setIsAdmin(false)
      }
      
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes (only if not using server props)
    let subscription: { unsubscribe: () => void } | null = null
    if (initialIsLoggedIn === undefined) {
      const supabase = createClient()
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null)
        
        // Check shop ownership when auth state changes
        if (session?.user) {
          const { data: profile } = await supabase.from("users").select("role").eq("id", session.user.id).maybeSingle()
          setIsAdmin(profile?.role === "admin")

          const { data: shop } = await supabase
            .from("repair_shops")
            .select("id")
            .eq("owner_id", session.user.id)
            .maybeSingle()
          setIsShopOwner(!!shop)
        } else {
          setIsShopOwner(false)
          setIsAdmin(false)
        }
      })
      subscription = sub
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [initialIsLoggedIn])

  const isLoggedIn = initialIsLoggedIn !== undefined ? initialIsLoggedIn : !!user

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
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">{t.nav.admin ?? "Admin"}</Button>
                </Link>
              )}
              <Link href="/shops">
                <Button variant="ghost" size="sm">{t.nav.shops}</Button>
              </Link>
              {!loading && (
                isLoggedIn ? (
                  <>
                    {isShopOwner && (
                      <Link href="/shop/dashboard">
                        <Button variant="ghost" size="sm">{t.nav.dashboard}</Button>
                      </Link>
                    )}
                    <Link href="/user/diagnosis-history">
                      <Button variant="ghost" size="sm">{t.nav.history}</Button>
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm">{t.nav.login}</Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button variant="ghost" size="sm">{t.nav.signUp}</Button>
                    </Link>
                  </>
                )
              )}
            </nav>
            {/* Mobile Menu Button */}
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={(e) => {
                e.stopPropagation()
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg md:hidden z-50">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{t.nav.admin ?? "Admin"}</Button>
                </Link>
              )}
              <Link href="/shops" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.shops}</Button>
              </Link>
              {!loading && (
                isLoggedIn ? (
                  <>
                    {isShopOwner && (
                      <Link href="/shop/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">{t.nav.dashboard}</Button>
                      </Link>
                    )}
                    <Link href="/user/diagnosis-history" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">{t.nav.history}</Button>
                    </Link>
                    <div className="pt-2 border-t">
                      <LogoutButton variant="full" />
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">{t.nav.login}</Button>
                    </Link>
                    <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">{t.nav.signUp}</Button>
                    </Link>
                  </>
                )
              )}
            </nav>
          </div>
        )}
      </header>
    )
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {showBackButton && onBack && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="gap-2 hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">{t.common.back}</span>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="FixWise Logo" 
              width={180} 
              height={60}
              className="h-10 w-auto sm:h-12"
            />
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <LanguageSwitcher />
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">{t.nav.admin ?? "Admin"}</Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm">{t.nav.home}</Button>
            </Link>
            <Link href="/shops">
              <Button variant="ghost" size="sm">{t.nav.shops}</Button>
            </Link>
            {!loading && (
              isLoggedIn ? (
                <>
                  {isShopOwner && (
                    <Link href="/shop/dashboard">
                      <Button variant="ghost" size="sm">{t.nav.dashboard}</Button>
                    </Link>
                  )}
                  <Link href="/user/diagnosis-history">
                    <Button variant="ghost" size="sm">{t.nav.history}</Button>
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">{t.nav.login}</Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button variant="outline" size="sm">{t.nav.signUp}</Button>
                  </Link>
                </>
              )
            )}
          </nav>
          {/* Mobile Menu Button */}
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={(e) => {
              e.stopPropagation()
              setMobileMenuOpen(!mobileMenuOpen)
            }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg lg:hidden z-50">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.admin ?? "Admin"}</Button>
              </Link>
            )}
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t.nav.home}</Button>
            </Link>
            <Link href="/shops" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t.nav.shops}</Button>
            </Link>
            {!loading && (
              isLoggedIn ? (
                <>
                  {isShopOwner && (
                    <Link href="/shop/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">{t.nav.dashboard}</Button>
                    </Link>
                  )}
                  <Link href="/user/diagnosis-history" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">{t.nav.history}</Button>
                  </Link>
                  <div className="pt-2 border-t">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">{t.nav.login}</Button>
                  </Link>
                  <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">{t.nav.signUp}</Button>
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

