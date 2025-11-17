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

interface ShopDashboardProps {
  user: User
  profile: any
  shop: any
  leads: any[]
  bookingsCount?: number
}

export function ShopDashboard({ user, profile, shop, leads: initialLeads, bookingsCount = 0 }: ShopDashboardProps) {
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="FixWise Logo" 
              width={180} 
              height={60}
              className="h-12 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name || user.email}</p>
        </div>

        {!shop ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Set Up Your Shop
              </CardTitle>
              <CardDescription>You haven't created a shop listing yet</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your shop profile to start receiving repair requests from customers.
              </p>
              <Link href="/shop/settings">
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Create Shop Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Shop Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {shop.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{shop.address}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/shop/products">
                      <Button variant="outline" size="sm">
                        <Package className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link href="/shop/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div>
                    <p className="text-sm font-semibold">Rating</p>
                    <p className="text-2xl font-bold">{shop.rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Bookings</p>
                    <p className="text-2xl font-bold text-purple-600">{bookingsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Accepted</p>
                    <p className="text-2xl font-bold text-blue-600">{acceptedCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Link href="/shop/products" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Package className="mr-2 h-4 w-4" />
                      Products & Services
                    </Button>
                  </Link>
                  <Link href="/shop/bookings" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Calendar
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
                  Repair Requests
                </CardTitle>
                <CardDescription>Manage customer repair requests</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No leads yet</p>
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
