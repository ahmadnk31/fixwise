"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ShopGalleryProps {
  images: string[]
  shopName: string
}

export function ShopGallery({ images, shopName }: ShopGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)

  if (!images || images.length === 0) return null

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index)
    setIsFullscreen(true)
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
  }

  const nextFullscreen = () => {
    setFullscreenIndex((prev) => (prev + 1) % images.length)
  }

  const prevFullscreen = () => {
    setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFullscreen) return
    
    if (e.key === "Escape") {
      closeFullscreen()
    } else if (e.key === "ArrowLeft") {
      prevFullscreen()
    } else if (e.key === "ArrowRight") {
      nextFullscreen()
    }
  }

  // Focus management for keyboard navigation
  const fullscreenRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isFullscreen && fullscreenRef.current) {
      fullscreenRef.current.focus()
    }
  }, [isFullscreen])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Main Carousel */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border mb-4 bg-muted">
            <Image
              src={images[currentIndex]}
              alt={`${shopName} gallery image ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority={currentIndex === 0}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                
                {/* Fullscreen Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => openFullscreen(currentIndex)}
                  aria-label="Open fullscreen"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-transparent hover:border-primary/50"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Grid View Toggle (if more than 1 image) */}
          {images.length > 1 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Click on any image below to view in fullscreen</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {images.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => openFullscreen(index)}
                    className="relative aspect-square rounded-lg overflow-hidden border group cursor-pointer"
                    aria-label={`View image ${index + 1} in fullscreen`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${shopName} gallery image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Lightbox */}
      {isFullscreen && (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center outline-none"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery fullscreen view"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
            onClick={closeFullscreen}
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                onClick={prevFullscreen}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                onClick={nextFullscreen}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Fullscreen Image */}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4">
            <Image
              src={images[fullscreenIndex]}
              alt={`${shopName} gallery image ${fullscreenIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-base">
              {fullscreenIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail Strip in Fullscreen */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4">
              {images.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setFullscreenIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === fullscreenIndex
                      ? "border-white ring-2 ring-white/50"
                      : "border-transparent hover:border-white/50 opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

