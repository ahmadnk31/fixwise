'use client'

import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { LogoutButton } from './logout-button'

interface NavbarTranslationsProps {
  isLoggedIn: boolean
  isShopOwner: boolean
  variant?: 'default' | 'minimal'
  showLogoutInMobile?: boolean
}

export function NavbarTranslations({ isLoggedIn, isShopOwner, variant = 'default', showLogoutInMobile = false }: NavbarTranslationsProps) {
  const { t } = useI18n()
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

  if (variant === 'minimal') {
    return (
      <>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/shops">
            <Button variant="ghost" size="sm">{t.nav.shops}</Button>
          </Link>
          {isLoggedIn ? (
            <>
              {isShopOwner && (
                <Link href="/shop/dashboard">
                  <Button variant="ghost" size="sm">{t.nav.dashboard}</Button>
                </Link>
              )}
              <Link href="/user/diagnosis-history">
                <Button variant="ghost" size="sm">{t.nav.history}</Button>
              </Link>
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg md:hidden z-50">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link href="/shops" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.shops}</Button>
              </Link>
              {isLoggedIn ? (
                <>
                  {isShopOwner && (
                    <Link href="/shop/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">{t.nav.dashboard}</Button>
                    </Link>
                  )}
                  <Link href="/user/diagnosis-history" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">{t.nav.history}</Button>
                  </Link>
                  {showLogoutInMobile && (
                    <div className="pt-2 border-t">
                      <LogoutButton variant="full" />
                    </div>
                  )}
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
              )}
            </nav>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm">{t.nav.home}</Button>
        </Link>
        <Link href="/shops">
          <Button variant="ghost" size="sm">{t.nav.shops}</Button>
        </Link>
        {isLoggedIn ? (
          <>
            {isShopOwner && (
              <Link href="/shop/dashboard">
                <Button variant="ghost" size="sm">{t.nav.dashboard}</Button>
              </Link>
            )}
            <Link href="/user/diagnosis-history">
              <Button variant="ghost" size="sm">{t.nav.history}</Button>
            </Link>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg lg:hidden z-50">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t.nav.home}</Button>
            </Link>
            <Link href="/shops" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t.nav.shops}</Button>
            </Link>
            {isLoggedIn ? (
              <>
                {isShopOwner && (
                  <Link href="/shop/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">{t.nav.dashboard}</Button>
                  </Link>
                )}
                <Link href="/user/diagnosis-history" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{t.nav.history}</Button>
                </Link>
                {showLogoutInMobile && (
                  <div className="pt-2 border-t">
                    <LogoutButton />
                  </div>
                )}
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
            )}
          </nav>
        </div>
        )}
    </>
  )
}

