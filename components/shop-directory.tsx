"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Mail, Star, Wrench, Search, Navigation, Loader2, AlertCircle, ArrowLeft, Map, X } from 'lucide-react'
import type { RepairShop, Diagnosis } from "@/lib/types"
import Link from "next/link"
import { ShopMap } from "./shop-map"
import { calculateDistance, formatDistance } from "@/lib/utils/distance"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { NavbarClient } from "./navbar-client"
import { useI18n } from "@/lib/i18n/context"
import { ShopStatus } from "./shop-status"
import { NightOverlay } from "./night-overlay"

interface ShopDirectoryProps {
  shops: RepairShop[]
  diagnosis: Diagnosis | null
  repairComponent?: string | null
}

export function ShopDirectory({ shops, diagnosis, repairComponent }: ShopDirectoryProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedShop, setSelectedShop] = useState<RepairShop | null>(null)
  const [hoveredShop, setHoveredShop] = useState<RepairShop | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [shopsWithDistance, setShopsWithDistance] = useState<RepairShop[]>(shops)
  const [isMapOpen, setIsMapOpen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    requestUserLocation()
  }, [])

  useEffect(() => {
    if (userLocation) {
      const shopsWithDist = shops.map((shop) => {
        if (shop.latitude && shop.longitude) {
          const distance = calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)
          return { ...shop, distance }
        }
        return shop
      })
      // Sort by distance
      shopsWithDist.sort((a, b) => {
        if (a.distance === undefined) return 1
        if (b.distance === undefined) return -1
        return a.distance - b.distance
      })
      setShopsWithDistance(shopsWithDist)
    } else {
      setShopsWithDistance(shops)
    }
  }, [userLocation, shops])

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert(t.shops.locationNotSupported)
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationLoading(false)
      },
    )
  }

  const filteredShops = shopsWithDistance.filter((shop) => {
    const query = searchQuery.toLowerCase()
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.address.toLowerCase().includes(query) ||
      shop.expertise.some((exp) => exp.toLowerCase().includes(query))
    )
  })

  const handleContactShop = async (shopId: string) => {
    if (!diagnosis) {
      alert(t.shops.completeDiagnosisFirst)
      return
    }

    console.log("[v0] Contacting shop - diagnosis:", diagnosis.id, "shop:", shopId)

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisId: diagnosis.id,
          shopId,
        }),
      })

      const data = await response.json()
      console.log("[v0] Lead creation response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead")
      }

      alert(t.shops.contactShop + " - " + t.common.success)
    } catch (error) {
      console.error("[v0] Error creating lead:", error)
      alert(`${t.shops.contactShop} - ${error instanceof Error ? error.message : t.common.error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      
      <div className="container mx-auto px-4 py-8">
        {diagnosis && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">{t.diagnosis.title}</CardTitle>
              <CardDescription>{diagnosis.ai_response.probable_issue}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.diagnosis.estimatedCost}: <span className="font-semibold">{diagnosis.estimated_cost}</span>
              </p>
              {repairComponent && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t.shops.findShops} - <span className="font-semibold">{repairComponent}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {repairComponent && filteredShops.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.shops.noShops}</AlertTitle>
            <AlertDescription>
              {t.shops.noShops} - {repairComponent}. <Link href="/shops" className="underline font-semibold">{t.shops.title}</Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{t.shops.title}</h1>
            <p className="text-muted-foreground">{t.shops.findShops}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMapOpen(!isMapOpen)}
              className="gap-2 bg-transparent"
            >
              {isMapOpen ? (
                <>
                  <X className="h-4 w-4" />
                  Hide Map
                </>
              ) : (
                <>
                  <Map className="h-4 w-4" />
                  Show Map
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={requestUserLocation}
              disabled={locationLoading}
              className="gap-2 bg-transparent"
            >
              {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {locationLoading ? t.shops.loadingLocation : userLocation ? t.common.edit : t.shops.getDirections}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.shops.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className={`grid gap-6 transition-all duration-300 ${isMapOpen ? 'lg:grid-cols-[1fr_400px]' : 'lg:grid-cols-1'}`}>
          {/* Shop List */}
          <div className={`${isMapOpen ? 'order-2 lg:order-1' : 'order-1'}`}>
            {filteredShops.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t.shops.noShops}</p>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr ${isMapOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {filteredShops.map((shop) => (
                  <Card
                    key={shop.id}
                    className={`cursor-pointer transition-colors hover:border-primary overflow-hidden py-0 relative flex flex-col h-full ${
                      selectedShop?.id === shop.id ? "border-primary" : ""
                    } ${hoveredShop?.id === shop.id ? "border-primary/50 shadow-md" : ""}`}
                    onClick={() => setSelectedShop(shop)}
                    onMouseEnter={() => setHoveredShop(shop)}
                    onMouseLeave={() => setHoveredShop(null)}
                  >
                    <NightOverlay />
                    <CardHeader className="p-0 flex-shrink-0">
                      {/* Profile Image Header - Full Width */}
                      <div className="relative w-full h-48 overflow-hidden">
                        {shop.profile_image ? (
                          <Link href={`/shops/${shop.id}`} onClick={(e) => e.stopPropagation()}>
                            <Image
                              src={shop.profile_image}
                              alt={shop.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Wrench className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {/* Overlay with shop info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link href={`/shops/${shop.id}`} onClick={(e) => e.stopPropagation()} className="block">
                                  <CardTitle className="text-white hover:text-primary transition-colors break-words line-clamp-2 mb-1">
                                    {shop.name}
                                  </CardTitle>
                                </Link>
                                <CardDescription className="text-white/90 flex items-start gap-1 break-words text-sm">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="break-words line-clamp-1">{shop.address}</span>
                                  {shop.distance !== undefined && (
                                    <span className="ml-2 font-semibold text-primary whitespace-nowrap">• {formatDistance(shop.distance)}</span>
                                  )}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1 flex-shrink-0 bg-black/50 rounded px-2 py-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  <span className="font-semibold whitespace-nowrap text-sm text-white">{shop.rating.toFixed(1)}</span>
                                </div>
                                {shop.opening_hours && (
                                  <div className="flex-shrink-0">
                                    <ShopStatus openingHours={shop.opening_hours} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6 pt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="flex flex-wrap gap-2">
                        {shop.expertise.map((exp) => (
                          <Badge key={exp} variant="secondary" className="break-words">
                            {exp}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 text-sm">
                        {shop.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all">{shop.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="break-all">{shop.email}</span>
                        </div>
                        {shop.price_range && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold whitespace-nowrap">{t.shops.priceRange}:</span>
                            <span className="text-muted-foreground break-words">{shop.price_range}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto min-w-0 overflow-hidden">
                        <Link href={`/shops/${shop.id}`} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" className="w-full bg-transparent text-xs sm:text-sm max-w-full">
                            <span className="truncate block w-full">{t.shops.viewDetails} & {t.shops.reviews}</span>
                          </Button>
                        </Link>
                        {diagnosis && (
                          <Button
                            className="flex-1 min-w-0 text-xs sm:text-sm max-w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleContactShop(shop.id)
                            }}
                          >
                            <span className="truncate block w-full">{t.shops.contactShop}</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          {isMapOpen && (
            <div className={`order-1 lg:order-2 sticky top-4 h-[400px] lg:h-[calc(100vh-8rem)] min-h-[400px] z-10 transition-all duration-300`}>
              <ShopMap
                shops={filteredShops}
                selectedShop={selectedShop}
                hoveredShop={hoveredShop}
                onSelectShop={setSelectedShop}
                userLocation={userLocation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
