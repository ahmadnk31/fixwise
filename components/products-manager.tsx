"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Package, Wrench, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

interface Product {
  id: string
  name: string
  description: string
  category: string
  type: string
  price: number
  image_url: string
  in_stock: boolean
}

export function ProductsManager({ shop, initialProducts }: { shop: any; initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append("shopId", shop.id)

    // Add selected image if there's a new one
    if (selectedImage) {
      formData.append("image", selectedImage)
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PATCH" : "POST"

      if (editingProduct) {
        formData.append("existingImageUrl", editingProduct.image_url || "")
      }

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to save product")

      const { product } = await response.json()

      if (editingProduct) {
        setProducts(products.map((p) => (p.id === product.id ? product : p)))
      } else {
        setProducts([product, ...products])
      }

      // Reset form state
      setImagePreview(null)
      setSelectedImage(null)
      setEditingProduct(null)
      
      // Reset form if it still exists (check before resetting)
      if (form && form.reset) {
        form.reset()
      }
      
      // Close dialog after a brief delay to allow form reset
      setTimeout(() => {
        setIsDialogOpen(false)
      }, 100)
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete product")

      setProducts(products.filter((p) => p.id !== productId))
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product")
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setImagePreview(product.image_url || null)
    setSelectedImage(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setImagePreview(null)
    setSelectedImage(null)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(editingProduct?.image_url || null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/shop/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Products & Services</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">Manage your shop's products and services</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product/Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit" : "Add"} Product/Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingProduct?.name}
                    placeholder="e.g., iPhone Screen Repair"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingProduct?.category || "service"} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    name="type"
                    defaultValue={editingProduct?.type}
                    placeholder="e.g., screen_repair, battery_replacement"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingProduct?.description}
                    placeholder="Describe your product or service"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.price}
                    placeholder="0.00"
                  />
                </div>

                {editingProduct && (
                  <div className="flex items-center gap-2">
                    <Switch id="inStock" name="inStock" defaultChecked={editingProduct.in_stock} />
                    <Label htmlFor="inStock">In Stock / Available</Label>
                  </div>
                )}

                <div>
                  <Label>Image</Label>
                  {imagePreview ? (
                    <div className="mt-2 space-y-2">
                      <div className="relative flex justify-center">
                        <div className="relative max-h-64 overflow-hidden rounded-md border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-64 w-auto object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {selectedImage && (
                        <p className="text-xs text-muted-foreground">New image selected: {selectedImage.name}</p>
                      )}
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={`mt-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <input {...getInputProps()} name="image" />
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="rounded-full bg-primary/10 p-2">
                          {isDragActive ? (
                            <Upload className="h-5 w-5 text-primary" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {isDragActive ? (
                          <p className="text-xs font-medium text-primary">Drop the image here</p>
                        ) : (
                          <>
                            <p className="text-xs font-medium">
                              <span className="text-primary underline">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="relative pb-2">
                {product.image_url && (
                  <div className="relative mb-2 flex h-48 w-full items-center justify-center overflow-hidden rounded-md bg-muted">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      width={400}
                      height={192}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                )}
                <CardTitle className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {product.category === "service" ? (
                      <Wrench className="h-5 w-5 text-primary" />
                    ) : (
                      <Package className="h-5 w-5 text-primary" />
                    )}
                    <span className="line-clamp-2">{product.name}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-bold">${product.price?.toFixed(2)}</span>
                  <span className={`text-sm ${product.in_stock ? "text-green-600" : "text-red-600"}`}>
                    {product.in_stock ? "Available" : "Out of Stock"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No products or services yet. Add your first one!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
