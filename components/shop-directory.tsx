"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Mail, Star, Wrench, Search, Navigation, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import type { RepairShop, Diagnosis } from "@/lib/types"
import Link from "next/link"
import { ShopMap } from "./shop-map"
import { calculateDistance, formatDistance } from "@/lib/utils/distance"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { NavbarClient } from "./navbar-client"
import { useI18n } from "@/lib/i18n/context"

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

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{t.shops.title}</h1>
            <p className="text-muted-foreground">{t.shops.findShops}</p>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Shop List */}
          <div className="space-y-4 order-2 lg:order-1">
            {filteredShops.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t.shops.noShops}</p>
                </CardContent>
              </Card>
            ) : (
              filteredShops.map((shop) => (
                <Card
                  key={shop.id}
                  className={`cursor-pointer transition-colors hover:border-primary ${
                    selectedShop?.id === shop.id ? "border-primary" : ""
                  } ${hoveredShop?.id === shop.id ? "border-primary/50 shadow-md" : ""}`}
                  onClick={() => setSelectedShop(shop)}
                  onMouseEnter={() => setHoveredShop(shop)}
                  onMouseLeave={() => setHoveredShop(null)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/shops/${shop.id}`} onClick={(e) => e.stopPropagation()}>
                          <CardTitle className="hover:text-primary transition-colors">{shop.name}</CardTitle>
                        </Link>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shop.address}
                          {shop.distance !== undefined && (
                            <span className="ml-2 font-semibold text-primary">• {formatDistance(shop.distance)}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{shop.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {shop.expertise.map((exp) => (
                        <Badge key={exp} variant="secondary">
                          {exp}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm">
                      {shop.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {shop.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {shop.email}
                      </div>
                      {shop.price_range && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.shops.priceRange}:</span>
                          <span className="text-muted-foreground">{shop.price_range}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/shops/${shop.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" className="w-full bg-transparent">
                          {t.shops.viewDetails} & {t.shops.reviews}
                        </Button>
                      </Link>
                      {diagnosis && (
                        <Button
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleContactShop(shop.id)
                          }}
                        >
                          {t.shops.contactShop}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Map */}
          <div className="order-1 lg:order-2 sticky top-4 h-[400px] lg:h-[calc(100vh-8rem)] min-h-[400px] z-10">
            <ShopMap
              shops={filteredShops}
              selectedShop={selectedShop}
              hoveredShop={hoveredShop}
              onSelectShop={setSelectedShop}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
