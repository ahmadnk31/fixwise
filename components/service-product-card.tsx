"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package } from "lucide-react"

interface ServiceProductCardProps {
  id: string
  name: string
  description?: string | null
  price?: number | null
  image_url?: string | null
  category: "service" | "product"
  in_stock?: boolean
}

export function ServiceProductCard({
  id,
  name,
  description,
  price,
  image_url,
  category,
  in_stock,
}: ServiceProductCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="group flex gap-4 rounded-xl border-2 p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
      >
        {image_url && (
          <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted border">
            <Image
              src={image_url || "/placeholder.svg"}
              alt={name}
              width={96}
              height={96}
              className="h-full w-auto object-contain"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            {price && (
              <p className="text-xl font-bold text-primary">${price.toFixed(2)}</p>
            )}
            {category === "product" && in_stock && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                In Stock
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {category === "product" && <Package className="h-5 w-5 text-primary" />}
              <DialogTitle className="text-2xl">{name}</DialogTitle>
            </div>
            {price && (
              <DialogDescription className="text-lg font-semibold text-primary">
                ${price.toFixed(2)}
                {category === "service" && <span className="text-sm font-normal text-muted-foreground ml-2">per service</span>}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {image_url && (
              <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={image_url}
                  alt={name}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {category === "product" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Availability:</span>
                {in_stock ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Out of Stock
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

