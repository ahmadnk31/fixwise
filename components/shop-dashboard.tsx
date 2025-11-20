"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Store, Inbox, Calendar, Package } from 'lucide-react'
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import type { User } from "@supabase/supabase-js"
import { LeadCard } from "./lead-card"
import Image from "next/image"
import { useI18n } from "@/lib/i18n/context"

interface ShopDashboardProps {
  user: User
  profile: any
  shop: any
  leads: any[]
  bookingsCount?: number
}

export function ShopDashboard({ user, profile, shop, leads: initialLeads, bookingsCount = 0 }: ShopDashboardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [leads, setLeads] = useState(initialLeads)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update lead")
      }

      // Update local state
      setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)))
    } catch (error) {
      console.error("Error updating lead:", error)
      alert("Failed to update lead status")
    }
  }

  const pendingCount = leads.filter((l) => l.status === "pending").length
  const acceptedCount = leads.filter((l) => l.status === "accepted").length
  const completedCount = leads.filter((l) => l.status === "completed").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.dashboard.welcomeBack}, {profile?.name || user.email}</p>
        </div>

        {!shop ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t.dashboard.setUpShop}
              </CardTitle>
              <CardDescription>{t.dashboard.noShopListing}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {t.dashboard.createShopProfile}
              </p>
              <Link href="/shop/settings">
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  {t.dashboard.createShopProfileButton}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Shop Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">{shop.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm break-words">{shop.address}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href="/shop/products">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{t.dashboard.edit}</span>
                        <span className="sm:hidden">{t.dashboard.edit}</span>
                      </Button>
                    </Link>
                    <Link href="/shop/settings">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{t.dashboard.settings}</span>
                        <span className="sm:hidden">{t.dashboard.settings.substring(0, 3)}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">{t.dashboard.rating}</p>
                    <p className="text-xl sm:text-2xl font-bold">{shop.rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">{t.dashboard.bookings}</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">{bookingsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">{t.dashboard.pending}</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">{t.dashboard.accepted}</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{acceptedCount}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">{t.dashboard.completed}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{completedCount}</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2">
                  <Link href="/shop/products" className="flex-1">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <Package className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{t.dashboard.productsServices}</span>
                      <span className="sm:hidden">{t.dashboard.productsServices.split(' & ')[0]}</span>
                    </Button>
                  </Link>
                  <Link href="/shop/bookings" className="flex-1">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{t.dashboard.viewCalendar}</span>
                      <span className="sm:hidden">{t.nav.bookings}</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  {t.dashboard.repairRequests}
                </CardTitle>
                <CardDescription>{t.dashboard.manageRequests}</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t.dashboard.noLeads}</p>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onStatusUpdate={handleStatusUpdate} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
