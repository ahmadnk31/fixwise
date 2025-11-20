"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, CheckCircle2, Loader2, AlertCircle, X, Globe, Facebook, Instagram, Twitter, Edit } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { useGoogleMaps } from "@/lib/hooks/use-google-maps"

declare global {
  interface Window {
    google: any
  }
}

type StatKey = "shops" | "users" | "bookings" | "diagnoses"

interface AdminDashboardProps {
  stats: Record<StatKey, number>
  shops: any[]
  users: {
    id: string
    name: string | null
    email: string
    role: string
    created_at: string
  }[]
  bookings: {
    id: string
    shop_id: string
    status: string
    appointment_date: string
    appointment_time: string
    user_name: string
    user_email: string
    created_at: string
  }[]
  diagnoses: {
    id: string
    user_id: string | null
    user_input: string
    estimated_cost: string | null
    created_at: string
  }[]
}

const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"] as const

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
]

export function AdminDashboard({ stats, shops, users, bookings, diagnoses }: AdminDashboardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<any | null>(null)
  const [isEditShopOpen, setIsEditShopOpen] = useState(false)
  const { isLoaded: mapsLoaded } = useGoogleMaps()
  
  // Address autocomplete refs
  const createAddressInputRef = useRef<HTMLInputElement>(null)
  const editAddressInputRef = useRef<HTMLInputElement>(null)
  const createAutocompleteRef = useRef<any>(null)
  const editAutocompleteRef = useRef<any>(null)
  
  const [newShop, setNewShop] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    owner_id: "",
    price_range: "$$",
    country: "",
    business_name: "",
    vat_number: "",
    registration_number: "",
    business_address: "",
    business_type: "company",
    vat_validated: false,
    expertise: [] as string[],
    bio: "",
    description: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    social_website: "",
    max_bookings_per_day: 10,
    max_bookings_per_slot: 1,
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    slot_duration_minutes: 30,
    buffer_time_minutes: 15,
    advance_booking_days: 30,
    same_day_booking_allowed: true,
    auto_confirm: false,
    require_phone: false,
  })
  const [newExpertise, setNewExpertise] = useState("")
  const [isValidatingVat, setIsValidatingVat] = useState(false)
  const [vatValidationMessage, setVatValidationMessage] = useState("")
  
  // Initialize autocomplete for create dialog
  const initializeCreateAutocomplete = () => {
    if (!createAddressInputRef.current || !window.google?.maps?.places) {
      return false
    }

    // Check if element is actually in the DOM
    if (!document.contains(createAddressInputRef.current)) {
      return false
    }

    // Clean up existing autocomplete if any
    if (createAutocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(createAutocompleteRef.current)
      createAutocompleteRef.current = null
    }

    try {
      createAutocompleteRef.current = new window.google.maps.places.Autocomplete(createAddressInputRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry"],
      })

      createAutocompleteRef.current.addListener("place_changed", () => {
        const place = createAutocompleteRef.current.getPlace()

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          setNewShop((prev) => ({
            ...prev,
            address: place.formatted_address || "",
            latitude: lat,
            longitude: lng,
          }))
        }
      })
      return true
    } catch (error) {
      console.error("Error initializing autocomplete:", error)
      return false
    }
  }

  useEffect(() => {
    if (mapsLoaded && isCreateShopOpen) {
      // Try to initialize immediately, then retry with delays if needed
      let attempts = 0
      const maxAttempts = 5
      
      const tryInitialize = () => {
        if (initializeCreateAutocomplete()) {
          return // Success
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 100)
        }
      }
      
      const timer = setTimeout(tryInitialize, 50)
      return () => clearTimeout(timer)
    } else if (!isCreateShopOpen && createAutocompleteRef.current) {
      // Cleanup when dialog closes
      try {
        // Disconnect observer if it exists
        if ((createAutocompleteRef.current as any)._observer) {
          (createAutocompleteRef.current as any)._observer.disconnect()
        }
        window.google.maps.event.clearInstanceListeners(createAutocompleteRef.current)
      } catch (e) {
        // Ignore cleanup errors
      }
      createAutocompleteRef.current = null
    }
  }, [mapsLoaded, isCreateShopOpen])
  
  // Initialize autocomplete for edit dialog
  const initializeEditAutocomplete = () => {
    if (!editAddressInputRef.current || !window.google?.maps?.places) {
      return false
    }

    // Check if element is actually in the DOM
    if (!document.contains(editAddressInputRef.current)) {
      return false
    }

    // Clean up existing autocomplete if any
    if (editAutocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(editAutocompleteRef.current)
      editAutocompleteRef.current = null
    }

    try {
      editAutocompleteRef.current = new window.google.maps.places.Autocomplete(editAddressInputRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry"],
      })

      editAutocompleteRef.current.addListener("place_changed", () => {
        const place = editAutocompleteRef.current.getPlace()

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          setNewShop((prev) => ({
            ...prev,
            address: place.formatted_address || "",
            latitude: lat,
            longitude: lng,
          }))
        }
      })
      
      // Monitor for pac-container creation and update z-index
      const observer = new MutationObserver(() => {
        const pacContainer = document.querySelector('.pac-container') as HTMLElement
        if (pacContainer) {
          pacContainer.style.zIndex = '10000'
          pacContainer.style.pointerEvents = 'auto'
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      
      // Store observer for cleanup
      ;(editAutocompleteRef.current as any)._observer = observer
      return true
    } catch (error) {
      console.error("Error initializing autocomplete:", error)
      return false
    }
  }

  useEffect(() => {
    if (mapsLoaded && isEditShopOpen) {
      // Try to initialize immediately, then retry with delays if needed
      let attempts = 0
      const maxAttempts = 5
      
      const tryInitialize = () => {
        if (initializeEditAutocomplete()) {
          return // Success
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 100)
        }
      }
      
      const timer = setTimeout(tryInitialize, 50)
      return () => clearTimeout(timer)
    } else if (!isEditShopOpen && editAutocompleteRef.current) {
      // Cleanup when dialog closes
      try {
        // Disconnect observer if it exists
        if ((editAutocompleteRef.current as any)._observer) {
          (editAutocompleteRef.current as any)._observer.disconnect()
        }
        window.google.maps.event.clearInstanceListeners(editAutocompleteRef.current)
      } catch (e) {
        // Ignore cleanup errors
      }
      editAutocompleteRef.current = null
    }
  }, [mapsLoaded, isEditShopOpen])

  const handleDeleteShop = (shopId: string) => {
    startTransition(async () => {
      setMessage(null)
      setError(null)

      const res = await fetch(`/api/admin/shops/${shopId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || t.admin.failedToDelete)
        return
      }

      setMessage(t.admin.shopDeleted)
      router.refresh()
    })
  }

  const handleBookingStatusChange = (bookingId: string, status: string) => {
    startTransition(async () => {
      setMessage(null)
      setError(null)

      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || t.admin.failedToUpdateBooking)
        return
      }

      setMessage(t.admin.bookingUpdated)
      router.refresh()
    })
  }

  const isEUCountry = EU_COUNTRIES.some((c) => c.code === newShop.country)

  const addExpertise = () => {
    if (newExpertise.trim() && !newShop.expertise.includes(newExpertise.trim())) {
      setNewShop({ ...newShop, expertise: [...newShop.expertise, newExpertise.trim()] })
      setNewExpertise("")
    }
  }

  const removeExpertise = (item: string) => {
    setNewShop({ ...newShop, expertise: newShop.expertise.filter((e) => e !== item) })
  }

  const handleValidateVat = async () => {
    if (!newShop.vat_number || !newShop.country) {
      setVatValidationMessage("Please enter VAT number and select country")
      return
    }

    setIsValidatingVat(true)
    setVatValidationMessage("")

    try {
      const response = await fetch("/api/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatNumber: newShop.vat_number, countryCode: newShop.country }),
      })

      const data = await response.json()

      if (data.valid) {
        setVatValidationMessage("VAT number validated successfully!")
        if (data.name && !newShop.business_name) {
          setNewShop({ ...newShop, business_name: data.name, vat_validated: true })
        } else {
          setNewShop({ ...newShop, vat_validated: true })
        }
      } else {
        setNewShop({ ...newShop, vat_validated: false })
        setVatValidationMessage(data.error || "Invalid VAT number")
      }
    } catch (error) {
      setVatValidationMessage("Error validating VAT number")
    } finally {
      setIsValidatingVat(false)
    }
  }

  const handleEditShop = (shop: any) => {
    setEditingShop(shop)
    setNewShop({
      name: shop.name || "",
      email: shop.email || "",
      phone: shop.phone || "",
      address: shop.address || "",
      latitude: shop.latitude || null,
      longitude: shop.longitude || null,
      owner_id: shop.owner_id || "",
      price_range: shop.price_range || "$$",
      country: shop.business_country || "",
      business_name: shop.business_name || "",
      vat_number: shop.vat_number || "",
      registration_number: shop.company_registration || "",
      business_address: shop.business_address || "",
      business_type: shop.business_type || "company",
      vat_validated: shop.vat_validated || false,
      expertise: shop.expertise || [],
      bio: shop.bio || "",
      description: shop.description || "",
      social_facebook: shop.social_media?.facebook || "",
      social_instagram: shop.social_media?.instagram || "",
      social_twitter: shop.social_media?.twitter || "",
      social_website: shop.social_media?.website || "",
      max_bookings_per_day: shop.booking_preferences?.max_bookings_per_day || 10,
      max_bookings_per_slot: shop.booking_preferences?.max_bookings_per_slot || 1,
      working_hours_start: shop.booking_preferences?.working_hours?.start || "09:00",
      working_hours_end: shop.booking_preferences?.working_hours?.end || "17:00",
      slot_duration_minutes: shop.booking_preferences?.slot_duration_minutes || 30,
      buffer_time_minutes: shop.booking_preferences?.buffer_time_minutes || 15,
      advance_booking_days: shop.booking_preferences?.advance_booking_days || 30,
      same_day_booking_allowed: shop.booking_preferences?.same_day_booking_allowed ?? true,
      auto_confirm: shop.booking_preferences?.auto_confirm ?? false,
      require_phone: shop.booking_preferences?.require_phone ?? false,
    })
    setVatValidationMessage("")
    setNewExpertise("")
    setIsEditShopOpen(true)
  }

  const handleUpdateShop = () => {
    if (!editingShop) return

    startTransition(async () => {
      setMessage(null)
      setError(null)

      if (!newShop.name || !newShop.email || !newShop.address) {
        setError(t.admin.fillRequiredFields)
        return
      }

      if (isEUCountry && newShop.country) {
        if (!newShop.business_name || !newShop.vat_number || !newShop.registration_number || !newShop.business_address) {
          setError(t.admin.fillBusinessDetails)
          return
        }
      }

      const payload = {
        name: newShop.name,
        email: newShop.email,
        phone: newShop.phone,
        address: newShop.address,
        latitude: newShop.latitude,
        longitude: newShop.longitude,
        owner_id: newShop.owner_id === "none" ? null : newShop.owner_id,
        price_range: newShop.price_range,
        country: newShop.country,
        business_name: newShop.business_name,
        vat_number: newShop.vat_number,
        registration_number: newShop.registration_number,
        business_address: newShop.business_address,
        business_type: newShop.business_type,
        vat_validated: newShop.vat_validated,
        expertise: newShop.expertise,
        bio: newShop.bio,
        description: newShop.description,
        social_media: {
          facebook: newShop.social_facebook,
          instagram: newShop.social_instagram,
          twitter: newShop.social_twitter,
          website: newShop.social_website,
        },
        booking_preferences: {
          max_bookings_per_day: newShop.max_bookings_per_day,
          max_bookings_per_slot: newShop.max_bookings_per_slot,
          working_hours: {
            start: newShop.working_hours_start,
            end: newShop.working_hours_end,
          },
          slot_duration_minutes: newShop.slot_duration_minutes,
          buffer_time_minutes: newShop.buffer_time_minutes,
          advance_booking_days: newShop.advance_booking_days,
          same_day_booking_allowed: newShop.same_day_booking_allowed,
          auto_confirm: newShop.auto_confirm,
          require_phone: newShop.require_phone,
        },
      }

      const res = await fetch(`/api/admin/shops/${editingShop.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || t.admin.failedToUpdate)
        return
      }

      setMessage(t.admin.shopUpdated)
      setIsEditShopOpen(false)
      setEditingShop(null)
      setVatValidationMessage("")
      setNewExpertise("")
      router.refresh()
    })
  }

  const handleCreateShop = () => {
    startTransition(async () => {
      setMessage(null)
      setError(null)

      if (!newShop.name || !newShop.email || !newShop.address) {
        setError(t.admin.fillRequiredFields)
        return
      }

      if (isEUCountry && newShop.country) {
        if (!newShop.business_name || !newShop.vat_number || !newShop.registration_number || !newShop.business_address) {
          setError(t.admin.fillBusinessDetails)
          return
        }
      }

      const payload = {
        name: newShop.name,
        email: newShop.email,
        phone: newShop.phone,
        address: newShop.address,
        latitude: newShop.latitude,
        longitude: newShop.longitude,
        owner_id: newShop.owner_id === "none" ? null : newShop.owner_id,
        price_range: newShop.price_range,
        country: newShop.country,
        business_name: newShop.business_name,
        vat_number: newShop.vat_number,
        registration_number: newShop.registration_number,
        business_address: newShop.business_address,
        business_type: newShop.business_type,
        vat_validated: newShop.vat_validated,
        expertise: newShop.expertise,
        bio: newShop.bio,
        description: newShop.description,
        social_media: {
          facebook: newShop.social_facebook,
          instagram: newShop.social_instagram,
          twitter: newShop.social_twitter,
          website: newShop.social_website,
        },
        booking_preferences: {
          max_bookings_per_day: newShop.max_bookings_per_day,
          max_bookings_per_slot: newShop.max_bookings_per_slot,
          working_hours: {
            start: newShop.working_hours_start,
            end: newShop.working_hours_end,
          },
          slot_duration_minutes: newShop.slot_duration_minutes,
          buffer_time_minutes: newShop.buffer_time_minutes,
          advance_booking_days: newShop.advance_booking_days,
          same_day_booking_allowed: newShop.same_day_booking_allowed,
          auto_confirm: newShop.auto_confirm,
          require_phone: newShop.require_phone,
        },
      }

      const res = await fetch("/api/admin/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || t.admin.failedToCreate)
        return
      }

      setMessage(t.admin.shopCreated)
      setIsCreateShopOpen(false)
      setVatValidationMessage("")
      setNewExpertise("")
      setNewShop({
        name: "",
        email: "",
        phone: "",
        address: "",
        owner_id: "",
        price_range: "$$",
        country: "",
        business_name: "",
        vat_number: "",
        registration_number: "",
        business_address: "",
        business_type: "company",
        vat_validated: false,
        expertise: [],
        bio: "",
        description: "",
        social_facebook: "",
        social_instagram: "",
        social_twitter: "",
        social_website: "",
        max_bookings_per_day: 10,
        max_bookings_per_slot: 1,
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        slot_duration_minutes: 30,
        buffer_time_minutes: 15,
        advance_booking_days: 30,
        same_day_booking_allowed: true,
        auto_confirm: false,
        require_phone: false,
      })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.admin.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t.admin.description}
        </p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-md border p-3 text-sm ${
            error ? "border-destructive/50 text-destructive" : "border-green-500/40 text-green-600"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">{key}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg sm:text-xl">{t.admin.shops}</CardTitle>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <a href="/admin/shops/new">
                <Plus className="mr-2 h-4 w-4" />
                {t.admin.createShop}
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {shops.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noShops}</p>}
          {shops.map((shop) => (
            <div key={shop.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">{shop.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{shop.email}</p>
                {shop.address && <p className="text-xs sm:text-sm text-muted-foreground break-words">{shop.address}</p>}
                <p className="text-xs text-muted-foreground mt-1">{t.admin.created}: {new Date(shop.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <a href={`/admin/shops/${shop.id}/edit`}>
                    <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {t.common.edit}
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDeleteShop(shop.id)}
                  className="text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  {t.admin.delete}
                </Button>
                <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  <a href={`/shops/${shop.id}`} target="_blank" rel="noreferrer">
                    {t.admin.view}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.bookings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noBookings}</p>}
          {bookings.map((booking) => (
            <div key={booking.id} className="grid gap-3 rounded-lg border p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-center">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t.admin.customer}</p>
                <p className="font-semibold text-sm sm:text-base">{booking.user_name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{booking.user_email}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t.admin.appointment}</p>
                <p className="text-xs sm:text-sm text-foreground">
                  {booking.appointment_date}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  at {booking.appointment_time}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t.admin.status}</p>
                <Select
                  defaultValue={booking.status}
                  onValueChange={(value) => handleBookingStatusChange(booking.id, value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t.admin.created}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.recentDiagnoses}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnoses.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noDiagnoses}</p>}
            {diagnoses.slice(0, 8).map((diagnosis) => (
              <div key={diagnosis.id} className="rounded-lg border p-4">
                <p className="text-sm font-medium line-clamp-2">{diagnosis.user_input}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(diagnosis.created_at).toLocaleString()}
                </p>
                {diagnosis.estimated_cost && (
                  <Badge variant="secondary" className="mt-2 w-fit">
                    Est. Cost: {diagnosis.estimated_cost}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.users}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noUsers}</p>}
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-1 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{user.name || t.admin.unnamedUser}</p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {t.admin.joined}: {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Create Shop Dialog */}
      <Dialog open={isCreateShopOpen} onOpenChange={(open) => {
        setIsCreateShopOpen(open)
        if (!open) {
          setVatValidationMessage("")
          setNewExpertise("")
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 1000 }}>
          <DialogHeader>
            <DialogTitle>{t.admin.createNewShop}</DialogTitle>
            <DialogDescription>
              {t.admin.createNewShopDescription}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic</TabsTrigger>
              <TabsTrigger value="about" className="text-xs sm:text-sm">About</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
              <TabsTrigger value="social" className="text-xs sm:text-sm">Social</TabsTrigger>
              <TabsTrigger value="booking" className="text-xs sm:text-sm">Booking</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shop-name">Shop Name *</Label>
                  <Input
                    id="shop-name"
                    value={newShop.name}
                    onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                    placeholder="Enter shop name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-email">Email *</Label>
                  <Input
                    id="shop-email"
                    type="email"
                    value={newShop.email}
                    onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-phone">Phone</Label>
                  <Input
                    id="shop-phone"
                    type="tel"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-address">Address *</Label>
                  <Input
                    id="shop-address"
                    ref={createAddressInputRef}
                    value={newShop.address}
                    onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                    placeholder="Start typing an address..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-owner">Owner (Optional)</Label>
                  <Select 
                    value={newShop.owner_id || "none"} 
                    onValueChange={(value) => setNewShop({ ...newShop, owner_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="shop-owner">
                      <SelectValue placeholder="Select a user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No owner (admin managed)</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-price-range">Price Range</Label>
                  <Select
                    value={newShop.price_range}
                    onValueChange={(value) => setNewShop({ ...newShop, price_range: value })}
                  >
                    <SelectTrigger id="shop-price-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - Budget</SelectItem>
                      <SelectItem value="$$">$$ - Moderate</SelectItem>
                      <SelectItem value="$$$">$$$ - Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expertise">Expertise</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expertise"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="e.g., Camera, Screen, Battery"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExpertise()
                        }
                      }}
                    />
                    <Button type="button" onClick={addExpertise}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newShop.expertise.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1">
                        {item}
                        <button type="button" onClick={() => removeExpertise(item)} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shop-bio">Bio (Short Description)</Label>
                  <Textarea
                    id="shop-bio"
                    value={newShop.bio}
                    onChange={(e) => setNewShop({ ...newShop, bio: e.target.value })}
                    placeholder="A brief introduction to your shop..."
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{newShop.bio.length}/200 characters</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-description">Full Description</Label>
                  <Textarea
                    id="shop-description"
                    value={newShop.description}
                    onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
                    placeholder="Detailed information about your shop, services, experience, etc..."
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shop-country">Country</Label>
                  <Select value={newShop.country} onValueChange={(value) => setNewShop({ ...newShop, country: value, vat_validated: false, vat_number: "" })}>
                    <SelectTrigger id="shop-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {EU_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (Non-EU)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEUCountry && (
                  <>
                    <Alert>
                      <AlertDescription>
                        EU businesses must provide valid VAT and registration details
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-2">
                      <Label htmlFor="shop-business-name">Legal Business Name *</Label>
                      <Input
                        id="shop-business-name"
                        type="text"
                        placeholder="Acme Repair Ltd."
                        value={newShop.business_name}
                        onChange={(e) => setNewShop({ ...newShop, business_name: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shop-vat-number">VAT Number *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="shop-vat-number"
                          type="text"
                          placeholder="DE123456789"
                          value={newShop.vat_number}
                          onChange={(e) => {
                            setNewShop({ ...newShop, vat_number: e.target.value, vat_validated: false })
                            setVatValidationMessage("")
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidateVat}
                          disabled={isValidatingVat || !newShop.vat_number || !newShop.country}
                        >
                          {isValidatingVat ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : newShop.vat_validated ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            "Validate"
                          )}
                        </Button>
                      </div>
                      {vatValidationMessage && (
                        <p
                          className={`text-sm ${
                            newShop.vat_validated ? "text-green-600" : "text-destructive"
                          }`}
                        >
                          {vatValidationMessage}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shop-business-type">Business Type</Label>
                      <Select
                        value={newShop.business_type}
                        onValueChange={(value) => setNewShop({ ...newShop, business_type: value })}
                      >
                        <SelectTrigger id="shop-business-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="individual">Individual/Sole Trader</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shop-registration-number">Company Registration Number *</Label>
                      <Input
                        id="shop-registration-number"
                        type="text"
                        placeholder="HRB 123456"
                        value={newShop.registration_number}
                        onChange={(e) => setNewShop({ ...newShop, registration_number: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shop-business-address">Registered Business Address *</Label>
                      <Textarea
                        id="shop-business-address"
                        type="text"
                        placeholder="123 Main St, Berlin, Germany"
                        value={newShop.business_address}
                        onChange={(e) => setNewShop({ ...newShop, business_address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shop-website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="shop-website"
                    type="url"
                    value={newShop.social_website}
                    onChange={(e) => setNewShop({ ...newShop, social_website: e.target.value })}
                    placeholder="https://yourshop.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="shop-facebook"
                    type="url"
                    value={newShop.social_facebook}
                    onChange={(e) => setNewShop({ ...newShop, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/yourshop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="shop-instagram"
                    type="url"
                    value={newShop.social_instagram}
                    onChange={(e) => setNewShop({ ...newShop, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/yourshop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shop-twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="shop-twitter"
                    type="url"
                    value={newShop.social_twitter}
                    onChange={(e) => setNewShop({ ...newShop, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/yourshop"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="max-bookings-day">Max Bookings Per Day</Label>
                  <Input
                    id="max-bookings-day"
                    type="number"
                    min="1"
                    value={newShop.max_bookings_per_day}
                    onChange={(e) => setNewShop({ ...newShop, max_bookings_per_day: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max-bookings-slot">Max Bookings Per Time Slot</Label>
                  <Input
                    id="max-bookings-slot"
                    type="number"
                    min="1"
                    value={newShop.max_bookings_per_slot}
                    onChange={(e) => setNewShop({ ...newShop, max_bookings_per_slot: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="working-start">Working Hours Start</Label>
                  <Input
                    id="working-start"
                    type="time"
                    value={newShop.working_hours_start}
                    onChange={(e) => setNewShop({ ...newShop, working_hours_start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="working-end">Working Hours End</Label>
                  <Input
                    id="working-end"
                    type="time"
                    value={newShop.working_hours_end}
                    onChange={(e) => setNewShop({ ...newShop, working_hours_end: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
                  <Input
                    id="slot-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={newShop.slot_duration_minutes}
                    onChange={(e) => setNewShop({ ...newShop, slot_duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="buffer-time">Buffer Time Between Bookings (minutes)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    min="0"
                    value={newShop.buffer_time_minutes}
                    onChange={(e) => setNewShop({ ...newShop, buffer_time_minutes: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="advance-booking">Advance Booking Limit (days)</Label>
                  <Input
                    id="advance-booking"
                    type="number"
                    min="1"
                    value={newShop.advance_booking_days}
                    onChange={(e) => setNewShop({ ...newShop, advance_booking_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="same-day-booking">Allow Same-Day Bookings</Label>
                    <p className="text-xs text-muted-foreground">Allow customers to book appointments for today</p>
                  </div>
                  <Switch
                    id="same-day-booking"
                    checked={newShop.same_day_booking_allowed}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, same_day_booking_allowed: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-confirm">Auto-Confirm Bookings</Label>
                    <p className="text-xs text-muted-foreground">Automatically confirm bookings without manual approval</p>
                  </div>
                  <Switch
                    id="auto-confirm"
                    checked={newShop.auto_confirm}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, auto_confirm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-phone">Require Phone Number</Label>
                    <p className="text-xs text-muted-foreground">Make phone number mandatory for bookings</p>
                  </div>
                  <Switch
                    id="require-phone"
                    checked={newShop.require_phone}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, require_phone: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateShopOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreateShop} disabled={isPending}>
              {isPending ? t.common.loading : t.admin.createShop}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shop Dialog */}
      <Dialog open={isEditShopOpen} onOpenChange={(open) => {
        setIsEditShopOpen(open)
        if (!open) {
          setEditingShop(null)
          setVatValidationMessage("")
          setNewExpertise("")
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 1000 }}>
          <DialogHeader>
            <DialogTitle>{t.admin.editShop}</DialogTitle>
            <DialogDescription>
              {t.admin.updateShopDescription}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic</TabsTrigger>
              <TabsTrigger value="about" className="text-xs sm:text-sm">About</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
              <TabsTrigger value="social" className="text-xs sm:text-sm">Social</TabsTrigger>
              <TabsTrigger value="booking" className="text-xs sm:text-sm">Booking</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-name">Shop Name *</Label>
                  <Input
                    id="edit-shop-name"
                    value={newShop.name}
                    onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                    placeholder="Enter shop name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-email">Email *</Label>
                  <Input
                    id="edit-shop-email"
                    type="email"
                    value={newShop.email}
                    onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-phone">Phone</Label>
                  <Input
                    id="edit-shop-phone"
                    type="tel"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-address">Address *</Label>
                  <Input
                    id="edit-shop-address"
                    ref={editAddressInputRef}
                    value={newShop.address}
                    onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                    placeholder="Start typing an address..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-owner">Owner (Optional)</Label>
                  <Select 
                    value={newShop.owner_id || "none"} 
                    onValueChange={(value) => setNewShop({ ...newShop, owner_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="edit-shop-owner">
                      <SelectValue placeholder="Select a user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No owner (admin managed)</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-price-range">Price Range</Label>
                  <Select
                    value={newShop.price_range}
                    onValueChange={(value) => setNewShop({ ...newShop, price_range: value })}
                  >
                    <SelectTrigger id="edit-shop-price-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - Budget</SelectItem>
                      <SelectItem value="$$">$$ - Moderate</SelectItem>
                      <SelectItem value="$$$">$$$ - Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-expertise">Expertise</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-expertise"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="e.g., Camera, Screen, Battery"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExpertise()
                        }
                      }}
                    />
                    <Button type="button" onClick={addExpertise}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newShop.expertise.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1">
                        {item}
                        <button type="button" onClick={() => removeExpertise(item)} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-bio">Bio (Short Description)</Label>
                  <Textarea
                    id="edit-shop-bio"
                    value={newShop.bio}
                    onChange={(e) => setNewShop({ ...newShop, bio: e.target.value })}
                    placeholder="A brief introduction to your shop..."
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{newShop.bio.length}/200 characters</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-description">Full Description</Label>
                  <Textarea
                    id="edit-shop-description"
                    value={newShop.description}
                    onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
                    placeholder="Detailed information about your shop, services, experience, etc..."
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-country">Country</Label>
                  <Select value={newShop.country} onValueChange={(value) => setNewShop({ ...newShop, country: value, vat_validated: false, vat_number: "" })}>
                    <SelectTrigger id="edit-shop-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {EU_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (Non-EU)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEUCountry && (
                  <>
                    <Alert>
                      <AlertDescription>
                        EU businesses must provide valid VAT and registration details
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-shop-business-name">Legal Business Name *</Label>
                      <Input
                        id="edit-shop-business-name"
                        type="text"
                        placeholder="Acme Repair Ltd."
                        value={newShop.business_name}
                        onChange={(e) => setNewShop({ ...newShop, business_name: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-shop-vat-number">VAT Number *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-shop-vat-number"
                          type="text"
                          placeholder="DE123456789"
                          value={newShop.vat_number}
                          onChange={(e) => {
                            setNewShop({ ...newShop, vat_number: e.target.value, vat_validated: false })
                            setVatValidationMessage("")
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidateVat}
                          disabled={isValidatingVat || !newShop.vat_number || !newShop.country}
                        >
                          {isValidatingVat ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : newShop.vat_validated ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            "Validate"
                          )}
                        </Button>
                      </div>
                      {vatValidationMessage && (
                        <p
                          className={`text-sm ${
                            newShop.vat_validated ? "text-green-600" : "text-destructive"
                          }`}
                        >
                          {vatValidationMessage}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-shop-business-type">Business Type</Label>
                      <Select
                        value={newShop.business_type}
                        onValueChange={(value) => setNewShop({ ...newShop, business_type: value })}
                      >
                        <SelectTrigger id="edit-shop-business-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="individual">Individual/Sole Trader</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-shop-registration-number">Company Registration Number *</Label>
                      <Input
                        id="edit-shop-registration-number"
                        type="text"
                        placeholder="HRB 123456"
                        value={newShop.registration_number}
                        onChange={(e) => setNewShop({ ...newShop, registration_number: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-shop-business-address">Registered Business Address *</Label>
                      <Textarea
                        id="edit-shop-business-address"
                        type="text"
                        placeholder="123 Main St, Berlin, Germany"
                        value={newShop.business_address}
                        onChange={(e) => setNewShop({ ...newShop, business_address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="edit-shop-website"
                    type="url"
                    value={newShop.social_website}
                    onChange={(e) => setNewShop({ ...newShop, social_website: e.target.value })}
                    placeholder="https://yourshop.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="edit-shop-facebook"
                    type="url"
                    value={newShop.social_facebook}
                    onChange={(e) => setNewShop({ ...newShop, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/yourshop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="edit-shop-instagram"
                    type="url"
                    value={newShop.social_instagram}
                    onChange={(e) => setNewShop({ ...newShop, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/yourshop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shop-twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="edit-shop-twitter"
                    type="url"
                    value={newShop.social_twitter}
                    onChange={(e) => setNewShop({ ...newShop, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/yourshop"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-max-bookings-day">Max Bookings Per Day</Label>
                  <Input
                    id="edit-max-bookings-day"
                    type="number"
                    min="1"
                    value={newShop.max_bookings_per_day}
                    onChange={(e) => setNewShop({ ...newShop, max_bookings_per_day: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-max-bookings-slot">Max Bookings Per Time Slot</Label>
                  <Input
                    id="edit-max-bookings-slot"
                    type="number"
                    min="1"
                    value={newShop.max_bookings_per_slot}
                    onChange={(e) => setNewShop({ ...newShop, max_bookings_per_slot: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-working-start">Working Hours Start</Label>
                  <Input
                    id="edit-working-start"
                    type="time"
                    value={newShop.working_hours_start}
                    onChange={(e) => setNewShop({ ...newShop, working_hours_start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-working-end">Working Hours End</Label>
                  <Input
                    id="edit-working-end"
                    type="time"
                    value={newShop.working_hours_end}
                    onChange={(e) => setNewShop({ ...newShop, working_hours_end: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slot-duration">Slot Duration (minutes)</Label>
                  <Input
                    id="edit-slot-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={newShop.slot_duration_minutes}
                    onChange={(e) => setNewShop({ ...newShop, slot_duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-buffer-time">Buffer Time Between Bookings (minutes)</Label>
                  <Input
                    id="edit-buffer-time"
                    type="number"
                    min="0"
                    value={newShop.buffer_time_minutes}
                    onChange={(e) => setNewShop({ ...newShop, buffer_time_minutes: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-advance-booking">Advance Booking Limit (days)</Label>
                  <Input
                    id="edit-advance-booking"
                    type="number"
                    min="1"
                    value={newShop.advance_booking_days}
                    onChange={(e) => setNewShop({ ...newShop, advance_booking_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-same-day-booking">Allow Same-Day Bookings</Label>
                    <p className="text-xs text-muted-foreground">Allow customers to book appointments for today</p>
                  </div>
                  <Switch
                    id="edit-same-day-booking"
                    checked={newShop.same_day_booking_allowed}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, same_day_booking_allowed: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-auto-confirm">Auto-Confirm Bookings</Label>
                    <p className="text-xs text-muted-foreground">Automatically confirm bookings without manual approval</p>
                  </div>
                  <Switch
                    id="edit-auto-confirm"
                    checked={newShop.auto_confirm}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, auto_confirm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-require-phone">Require Phone Number</Label>
                    <p className="text-xs text-muted-foreground">Make phone number mandatory for bookings</p>
                  </div>
                  <Switch
                    id="edit-require-phone"
                    checked={newShop.require_phone}
                    onCheckedChange={(checked) => setNewShop({ ...newShop, require_phone: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditShopOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShop} disabled={isPending}>
              {isPending ? t.admin.updating : t.admin.updateShop}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

