"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Loader2, Navigation, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import type { RepairShop } from "@/lib/types"
import { useGoogleMaps } from "@/lib/hooks/use-google-maps"

interface ShopMapProps {
  shops: RepairShop[]
  selectedShop: RepairShop | null
  hoveredShop?: RepairShop | null
  onSelectShop: (shop: RepairShop | null) => void
  userLocation: { lat: number; lng: number } | null
}

declare global {
  interface Window {
    google: any
  }
}

export function ShopMap({ shops, selectedShop, hoveredShop, onSelectShop, userLocation }: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const mapInitializedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showingRoute, setShowingRoute] = useState(false)
  const { isLoaded: mapsLoaded, error: mapsError } = useGoogleMaps()

  useEffect(() => {
    if (mapsLoaded && window.google?.maps && !mapInitializedRef.current) {
          initializeMap()
      mapInitializedRef.current = true
    } else if (mapsError) {
        setIsLoading(false)
    }
  }, [mapsLoaded, mapsError])

  useEffect(() => {
    if (googleMapRef.current && shops.length > 0) {
      updateMarkers()
    }
  }, [shops, hoveredShop])

  useEffect(() => {
    // Prioritize selected shop, fall back to hovered shop
    const shopToShow = selectedShop || hoveredShop
    if (shopToShow && userLocation && googleMapRef.current) {
      showRoute(shopToShow)
    } else {
      clearRoute()
    }
  }, [selectedShop, hoveredShop, userLocation])

  useEffect(() => {
    if (userLocation && googleMapRef.current && window.google) {
      updateUserMarker()
    }
  }, [userLocation])

  // Handle map resize on window resize (important for responsive layouts)
  useEffect(() => {
    const handleResize = () => {
      if (googleMapRef.current && window.google) {
        setTimeout(() => {
          window.google.maps.event.trigger(googleMapRef.current, "resize")
        }, 100)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      return
    }

    const shopWithCoords = shops.find((s) => s.latitude && s.longitude)
    const center = userLocation
      ? userLocation
      : shopWithCoords
        ? { lat: shopWithCoords.latitude, lng: shopWithCoords.longitude }
        : { lat: 37.7749, lng: -122.4194 }

    const customMapStyles = [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#1A2332" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "administrative.land_parcel",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#e8e8e8" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road.local",
        elementType: "geometry",
        stylers: [{ visibility: "simplified" }],
      },
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#d4e7f5" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#7891a3" }],
      },
    ]

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: customMapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      gestureHandling: "greedy",
      clickableIcons: false,
    })

    directionsServiceRef.current = new window.google.maps.DirectionsService()
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: googleMapRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#1A2332",
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    })

    updateMarkers()
    if (userLocation) {
      updateUserMarker()
    }
    
    // Trigger resize after initialization to ensure proper rendering on mobile
    setTimeout(() => {
      if (googleMapRef.current && window.google) {
        window.google.maps.event.trigger(googleMapRef.current, "resize")
      }
    }, 100)
    
    setIsLoading(false)
  }

  const updateUserMarker = () => {
    if (!googleMapRef.current || !window.google || !userLocation) {
      return
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
    }

    userMarkerRef.current = new window.google.maps.Marker({
      position: userLocation,
      map: googleMapRef.current,
      title: "Your Location",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#1A2332",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 4,
      },
      animation: window.google.maps.Animation.DROP,
      zIndex: 1000,
    })
  }

  const showRoute = (shop?: RepairShop | null) => {
    const targetShop = shop || selectedShop || hoveredShop
    if (!targetShop?.latitude || !targetShop?.longitude || !userLocation) {
      return
    }

    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      return
    }

    const request = {
      origin: userLocation,
      destination: { lat: targetShop.latitude, lng: targetShop.longitude },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result)
        setShowingRoute(true)
      } else {
        console.error("Directions request failed:", status)
      }
    })
  }

  const clearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
      setShowingRoute(false)
    }
  }

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google) {
      return
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const bounds = new window.google.maps.LatLngBounds()
    let hasValidMarkers = false

    if (userLocation) {
      bounds.extend(userLocation)
      hasValidMarkers = true
    }

    shops.forEach((shop) => {
      if (!shop.latitude || !shop.longitude) {
        return
      }

      const position = { lat: shop.latitude, lng: shop.longitude }
      const isSelected = selectedShop?.id === shop.id
      const isHovered = hoveredShop?.id === shop.id

      // Determine marker color and size based on state
      let markerColor = "#3d4b5f"
      let markerSize = 40
      let markerHeight = 50
      let zIndex = 1

      if (isSelected) {
        markerColor = "#1A2332"
        markerSize = 48
        markerHeight = 60
        zIndex = 999
      } else if (isHovered) {
        markerColor = "#2563eb"
        markerSize = 44
        markerHeight = 55
        zIndex = 500
      }

      const marker = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: shop.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="${markerSize}" height="${markerHeight}" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#shadow)">
                <path d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 35 15 35s15-26.716 15-35c0-8.284-6.716-15-15-15z" 
                      fill="${markerColor}" />
                <circle cx="20" cy="15" r="6" fill="white" />
                <path d="M20 11 L22 15 L18 15 Z M20 19 L18 15 L22 15 Z" fill="${markerColor}" />
              </g>
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(markerSize, markerHeight),
          anchor: new window.google.maps.Point(markerSize / 2, markerHeight),
        },
        animation: isHovered ? window.google.maps.Animation.BOUNCE : null,
        zIndex: zIndex,
      })
      
      // Store shop reference on marker for hover updates
      ;(marker as any).shopId = shop.id

      marker.addListener("click", () => {
        onSelectShop(shop)
        googleMapRef.current.panTo(position)
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px; color: #1A2332;">${shop.name}</h3>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${shop.address}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
              ${shop.expertise
                .map(
                  (exp) =>
                    `<span style="background: #e8eef5; color: #1A2332; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${exp}</span>`,
                )
                .join("")}
            </div>
            ${shop.distance ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #1A2332; font-weight: 600;">📍 ${shop.distance.toFixed(1)} km away</p>` : ""}
          </div>
        `,
      })

      marker.addListener("mouseenter", () => {
        infoWindow.open(googleMapRef.current, marker)
      })

      marker.addListener("mouseleave", () => {
        if (!isSelected) {
          infoWindow.close()
        }
      })

      markersRef.current.push(marker)
      bounds.extend(position)
      hasValidMarkers = true
    })

    // Update marker animations based on hover state
    markersRef.current.forEach((marker) => {
      const markerShopId = (marker as any).shopId
      if (hoveredShop && markerShopId === hoveredShop.id) {
        marker.setAnimation(window.google.maps.Animation.BOUNCE)
      } else {
        marker.setAnimation(null)
      }
    })

    // Pan to hovered shop smoothly
    if (hoveredShop && googleMapRef.current && window.google) {
      const hoveredShopData = shops.find((s) => s.id === hoveredShop.id)
      if (hoveredShopData?.latitude && hoveredShopData?.longitude) {
        googleMapRef.current.panTo({
          lat: hoveredShopData.latitude,
          lng: hoveredShopData.longitude,
        })
      }
    }

    // Only fit bounds if not showing route and not hovering
    if (hasValidMarkers && googleMapRef.current && !showingRoute && !hoveredShop && !selectedShop) {
      googleMapRef.current.fitBounds(bounds, { padding: 60 })
    }
  }

  if (mapsError) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground">{mapsError}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Please check your Maps configuration in environment variables
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden py-0">
      <CardContent className="relative h-full p-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
        {showingRoute && (selectedShop || hoveredShop) && (
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-background/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Navigation className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {selectedShop ? "Directions to" : "Hovering over"}
                  </p>
                  <p className="font-semibold text-foreground">{(selectedShop || hoveredShop)?.name}</p>
                </div>
              </div>
              {selectedShop && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelectShop(null as any)}>
                <X className="h-4 w-4" />
              </Button>
              )}
            </div>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </CardContent>
    </Card>
  )
}
