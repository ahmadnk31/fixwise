import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { BookingListRealtime } from "@/components/booking-list-realtime"
import { BookingsCalendarRealtime } from "@/components/bookings-calendar-realtime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, List, Calendar } from 'lucide-react'

export default async function ShopBookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: shop } = await supabase.from("repair_shops").select("*").eq("owner_id", user.id).maybeSingle()

  if (!shop) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">You need to set up your shop first</p>
            <Button asChild>
              <Link href="/shop/settings">Set Up Shop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("shop_id", shop.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  const bookings = bookingsData || []

  const pendingCount = bookings.filter((b) => b.status === "pending").length
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length
  const completedCount = bookings.filter((b) => b.status === "completed").length

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
      <Link href="/shop/dashboard" className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl sm:text-3xl font-bold">Bookings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your appointment bookings</p>
      </div>

      {/* Stats */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="calendar" className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2 flex-1 sm:flex-initial">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List View</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <BookingsCalendarRealtime 
            initialBookings={bookings} 
            shopId={shop.id}
          />
        </TabsContent>
        
        <TabsContent value="list">
          <BookingListRealtime 
            initialBookings={bookings} 
            isShopOwner={true} 
            shopId={shop.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
