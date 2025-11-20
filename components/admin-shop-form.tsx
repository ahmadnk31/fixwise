"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { useGoogleMaps } from "@/lib/hooks/use-google-maps"
import { ArrowLeft, X, Loader2, CheckCircle2, Upload, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useDropzone } from "react-dropzone"
import { useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    google: any
  }
}

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

interface AdminShopFormProps {
  shop?: any
  users: {
    id: string
    name: string | null
    email: string
    role: string
  }[]
  mode: "create" | "edit"
}

export function AdminShopForm({ shop, users, mode }: AdminShopFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { isLoaded: mapsLoaded } = useGoogleMaps()
  
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  
  const [formData, setFormData] = useState({
    name: shop?.name || "",
    email: shop?.email || "",
    phone: shop?.phone || "",
    address: shop?.address || "",
    latitude: shop?.latitude || null,
    longitude: shop?.longitude || null,
    owner_id: shop?.owner_id || "",
    price_range: shop?.price_range || "$$",
    country: shop?.business_country || "",
    business_name: shop?.business_name || "",
    vat_number: shop?.vat_number || "",
    registration_number: shop?.company_registration || "",
    business_address: shop?.business_address || "",
    business_type: shop?.business_type || "company",
    vat_validated: shop?.vat_validated || false,
    expertise: shop?.expertise || [] as string[],
    bio: shop?.bio || "",
    description: shop?.description || "",
    social_facebook: shop?.social_media?.facebook || "",
    social_instagram: shop?.social_media?.instagram || "",
    social_twitter: shop?.social_media?.twitter || "",
    social_website: shop?.social_media?.website || "",
    max_bookings_per_day: shop?.booking_preferences?.max_bookings_per_day || 10,
    max_bookings_per_slot: shop?.booking_preferences?.max_bookings_per_slot || 1,
    working_hours_start: shop?.booking_preferences?.working_hours?.start || "09:00",
    working_hours_end: shop?.booking_preferences?.working_hours?.end || "17:00",
    slot_duration_minutes: shop?.booking_preferences?.slot_duration_minutes || 30,
    buffer_time_minutes: shop?.booking_preferences?.buffer_time_minutes || 15,
    advance_booking_days: shop?.booking_preferences?.advance_booking_days || 30,
    same_day_booking_allowed: shop?.booking_preferences?.same_day_booking_allowed ?? true,
    auto_confirm: shop?.booking_preferences?.auto_confirm ?? false,
    require_phone: shop?.booking_preferences?.require_phone ?? false,
  })
  
  const [newExpertise, setNewExpertise] = useState("")
  const [isValidatingVat, setIsValidatingVat] = useState(false)
  const [vatValidationMessage, setVatValidationMessage] = useState("")
  
  // Profile and gallery images
  const [profileImage, setProfileImage] = useState<string | null>(shop?.profile_image || null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(shop?.profile_image || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(shop?.gallery_images || [])
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([])
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>(shop?.gallery_images || [])
  
  const isEUCountry = EU_COUNTRIES.some((c) => c.code === formData.country)
  
  // Profile image dropzone
  const onProfileImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getProfileRootProps, getInputProps: getProfileInputProps, isDragActive: isProfileDragActive } = useDropzone({
    onDrop: onProfileImageDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  // Gallery images dropzone
  const onGalleryImagesDrop = useCallback((acceptedFiles: File[]) => {
    const maxNewFiles = 10 - galleryImagePreviews.length
    const filesToAdd = acceptedFiles.slice(0, maxNewFiles)
    const newFiles = [...galleryImageFiles, ...filesToAdd]
    setGalleryImageFiles(newFiles)
    
    // Create previews for new files
    filesToAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [galleryImageFiles, galleryImagePreviews.length])

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onGalleryImagesDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const removeGalleryImage = (index: number) => {
    const isExistingImage = index < galleryImages.length
    if (isExistingImage) {
      // Remove existing image
      setGalleryImages(galleryImages.filter((_, i) => i !== index))
      setGalleryImagePreviews(galleryImagePreviews.filter((_, i) => i !== index))
    } else {
      // Remove new file
      const fileIndex = index - galleryImages.length
      setGalleryImageFiles(galleryImageFiles.filter((_, i) => i !== fileIndex))
      setGalleryImagePreviews(galleryImagePreviews.filter((_, i) => i !== index))
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileImageFile(null)
    setProfileImagePreview(null)
  }
  
  // Initialize autocomplete
  useEffect(() => {
    if (mapsLoaded && window.google?.maps?.places && addressInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ["address"],
        fields: ["formatted_address", "geometry"],
      })

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace()

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          setFormData((prev) => ({
            ...prev,
            address: place.formatted_address || "",
            latitude: lat,
            longitude: lng,
          }))
        }
      })
    }
    
    return () => {
      if (autocompleteRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
        autocompleteRef.current = null
      }
    }
  }, [mapsLoaded])
  
  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData({ ...formData, expertise: [...formData.expertise, newExpertise.trim()] })
      setNewExpertise("")
    }
  }

  const removeExpertise = (item: string) => {
    setFormData({ ...formData, expertise: formData.expertise.filter((e) => e !== item) })
  }

  const handleValidateVat = async () => {
    if (!formData.vat_number || !formData.country) {
      setVatValidationMessage("Please enter VAT number and select country")
      return
    }

    setIsValidatingVat(true)
    setVatValidationMessage("")

    try {
      const response = await fetch("/api/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatNumber: formData.vat_number, countryCode: formData.country }),
      })

      const data = await response.json()

      if (data.valid) {
        setFormData({ ...formData, vat_validated: true })
        setVatValidationMessage("VAT number validated successfully!")
        if (data.name && !formData.business_name) {
          setFormData({ ...formData, business_name: data.name, vat_validated: true })
        } else {
          setFormData({ ...formData, vat_validated: true })
        }
      } else {
        setFormData({ ...formData, vat_validated: false })
        setVatValidationMessage(data.error || "Invalid VAT number")
      }
    } catch (error) {
      setVatValidationMessage("Error validating VAT number")
    } finally {
      setIsValidatingVat(false)
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      setError(null)
      setSuccess(false)

      if (!formData.name || !formData.email || !formData.address) {
        setError("Please fill in all required fields")
        return
      }

      if (isEUCountry && formData.country) {
        if (!formData.business_name || !formData.vat_number || !formData.registration_number || !formData.business_address) {
          setError("EU businesses must provide: business name, VAT number, registration number, and business address")
          return
        }
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError("You must be logged in to create/edit shops")
          return
        }

        // Upload profile image if new one is selected
        let profileImageUrl = profileImage
        if (profileImageFile) {
          const userId = formData.owner_id || user.id
          const fileExt = profileImageFile.name.split(".").pop()
          const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${userId}/${fileName}`

          // Delete old profile image if exists
          if (profileImage && profileImage.includes('shop-images')) {
            const oldPath = profileImage.split('/').slice(-2).join('/')
            await supabase.storage.from("shop-images").remove([oldPath])
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("shop-images")
            .upload(filePath, profileImageFile, {
              contentType: profileImageFile.type,
              cacheControl: "3600",
              upsert: true,
            })

          if (uploadError) {
            console.error("Profile image upload error:", uploadError)
          } else {
            const { data: { publicUrl } } = supabase.storage.from("shop-images").getPublicUrl(filePath)
            profileImageUrl = publicUrl
          }
        }

        // Upload gallery images if new ones are selected
        const newGalleryUrls: string[] = []
        if (galleryImageFiles.length > 0) {
          const userId = formData.owner_id || user.id
          for (const file of galleryImageFiles) {
            const fileExt = file.name.split(".").pop()
            const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("shop-images")
              .upload(filePath, file, {
                contentType: file.type,
                cacheControl: "3600",
              })

            if (uploadError) {
              console.error("Gallery image upload error:", uploadError)
            } else {
              const { data: { publicUrl } } = supabase.storage.from("shop-images").getPublicUrl(filePath)
              newGalleryUrls.push(publicUrl)
            }
          }
        }

        const payload = {
          name: formData.name,
          email: formData.email,
        phone: formData.phone,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        owner_id: formData.owner_id === "none" ? null : formData.owner_id,
        price_range: formData.price_range,
        country: formData.country,
        business_name: formData.business_name,
        vat_number: formData.vat_number,
        registration_number: formData.registration_number,
        business_address: formData.business_address,
        business_type: formData.business_type,
        vat_validated: formData.vat_validated,
        expertise: formData.expertise,
        profile_image: profileImageUrl,
        gallery_images: [...galleryImages, ...newGalleryUrls],
        bio: formData.bio,
        description: formData.description,
        social_media: {
          facebook: formData.social_facebook,
          instagram: formData.social_instagram,
          twitter: formData.social_twitter,
          website: formData.social_website,
        },
        booking_preferences: {
          max_bookings_per_day: formData.max_bookings_per_day,
          max_bookings_per_slot: formData.max_bookings_per_slot,
          working_hours: {
            start: formData.working_hours_start,
            end: formData.working_hours_end,
          },
          slot_duration_minutes: formData.slot_duration_minutes,
          buffer_time_minutes: formData.buffer_time_minutes,
          advance_booking_days: formData.advance_booking_days,
          same_day_booking_allowed: formData.same_day_booking_allowed,
          auto_confirm: formData.auto_confirm,
          require_phone: formData.require_phone,
        },
      }

        const url = mode === "create" ? "/api/admin/shops" : `/api/admin/shops/${shop.id}`
        const method = mode === "create" ? "POST" : "PATCH"
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error || `Failed to ${mode} shop`)
          return
        }

        setSuccess(true)
        setTimeout(() => {
          router.push("/admin")
          router.refresh()
        }, 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{mode === "create" ? "Create New Shop" : "Edit Shop"}</h1>
        <p className="text-muted-foreground mt-2">
          {mode === "create" ? "Add a new repair shop to the platform" : "Update shop information"}
        </p>
      </div>

      {(error || success) && (
        <div
          className={`mb-6 rounded-md border p-4 ${
            error ? "border-destructive/50 text-destructive bg-destructive/10" : "border-green-500/50 text-green-600 bg-green-500/10"
          }`}
        >
          <div className="flex items-center gap-2">
            {success && <CheckCircle2 className="h-5 w-5" />}
            {error || "Shop saved successfully! Redirecting..."}
          </div>
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shop-name">Shop Name *</Label>
              <Input
                id="shop-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter shop name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-email">Email *</Label>
              <Input
                id="shop-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="shop@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-phone">Phone</Label>
              <Input
                id="shop-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+32 123 456 789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-address">Address *</Label>
              <Input
                id="shop-address"
                ref={addressInputRef}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Start typing an address..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-owner">Owner (Optional)</Label>
              <Select 
                value={formData.owner_id || "none"} 
                onValueChange={(value) => setFormData({ ...formData, owner_id: value === "none" ? "" : value })}
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
                value={formData.price_range}
                onValueChange={(value) => setFormData({ ...formData, price_range: value })}
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
                {formData.expertise.map((item) => (
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

        <TabsContent value="profile" className="space-y-4 mt-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Profile & Gallery</h3>
            <p className="text-sm text-muted-foreground">Upload images to showcase your shop</p>
          </div>

          {/* Profile Image */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            {profileImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={profileImagePreview}
                  alt="Profile preview"
                  className="h-32 w-32 rounded-lg object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={removeProfileImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getProfileRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isProfileDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input {...getProfileInputProps()} />
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    {isProfileDragActive ? (
                      <Upload className="h-6 w-6 text-primary" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  {isProfileDragActive ? (
                    <p className="text-sm font-medium text-primary">Drop image here</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        <span className="text-primary underline">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div className="space-y-2">
            <Label>Gallery Images (up to 10)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryImagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Gallery ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => removeGalleryImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {galleryImagePreviews.length < 10 && (
                <div
                  {...getGalleryRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors h-24 flex items-center justify-center ${
                    isGalleryDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <input {...getGalleryInputProps()} />
                  <div className="text-center">
                    {isGalleryDragActive ? (
                      <p className="text-xs font-medium text-primary">Drop images</p>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Add</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="about" className="space-y-4 mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shop-bio">Bio (Short Description)</Label>
              <Textarea
                id="shop-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="A brief introduction to your shop..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{formData.bio.length}/200 characters</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-description">Full Description</Label>
              <Textarea
                id="shop-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed information about your shop, services, experience, etc..."
                rows={6}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4 mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shop-country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value, vat_validated: false, vat_number: "" })}>
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
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shop-vat-number">VAT Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="shop-vat-number"
                      type="text"
                      placeholder="DE123456789"
                      value={formData.vat_number}
                      onChange={(e) => {
                        setFormData({ ...formData, vat_number: e.target.value, vat_validated: false })
                        setVatValidationMessage("")
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateVat}
                      disabled={isValidatingVat || !formData.vat_number || !formData.country}
                    >
                      {isValidatingVat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                    </Button>
                  </div>
                  {vatValidationMessage && (
                    <p className={`text-sm ${formData.vat_validated ? "text-green-600" : "text-destructive"}`}>
                      {vatValidationMessage}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shop-business-type">Business Type</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                  >
                    <SelectTrigger id="shop-business-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shop-registration-number">Company Registration Number *</Label>
                  <Input
                    id="shop-registration-number"
                    type="text"
                    placeholder="12345678"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shop-business-address">Registered Business Address *</Label>
                  <Textarea
                    id="shop-business-address"
                    type="text"
                    placeholder="123 Main St, Berlin, Germany"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shop-website">Website</Label>
              <Input
                id="shop-website"
                type="url"
                value={formData.social_website}
                onChange={(e) => setFormData({ ...formData, social_website: e.target.value })}
                placeholder="https://yourshop.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-facebook">Facebook</Label>
              <Input
                id="shop-facebook"
                type="url"
                value={formData.social_facebook}
                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                placeholder="https://facebook.com/yourshop"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-instagram">Instagram</Label>
              <Input
                id="shop-instagram"
                type="url"
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                placeholder="https://instagram.com/yourshop"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-twitter">Twitter / X</Label>
              <Input
                id="shop-twitter"
                type="url"
                value={formData.social_twitter}
                onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                placeholder="https://twitter.com/yourshop"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="max-bookings-day">Max Bookings Per Day</Label>
              <Input
                id="max-bookings-day"
                type="number"
                min="1"
                value={formData.max_bookings_per_day}
                onChange={(e) => setFormData({ ...formData, max_bookings_per_day: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-bookings-slot">Max Bookings Per Time Slot</Label>
              <Input
                id="max-bookings-slot"
                type="number"
                min="1"
                value={formData.max_bookings_per_slot}
                onChange={(e) => setFormData({ ...formData, max_bookings_per_slot: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="working-start">Working Hours Start</Label>
              <Input
                id="working-start"
                type="time"
                value={formData.working_hours_start}
                onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="working-end">Working Hours End</Label>
              <Input
                id="working-end"
                type="time"
                value={formData.working_hours_end}
                onChange={(e) => setFormData({ ...formData, working_hours_end: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
              <Input
                id="slot-duration"
                type="number"
                min="15"
                step="15"
                value={formData.slot_duration_minutes}
                onChange={(e) => setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buffer-time">Buffer Time Between Bookings (minutes)</Label>
              <Input
                id="buffer-time"
                type="number"
                min="0"
                value={formData.buffer_time_minutes}
                onChange={(e) => setFormData({ ...formData, buffer_time_minutes: parseInt(e.target.value) || 15 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="advance-booking">Advance Booking Limit (days)</Label>
              <Input
                id="advance-booking"
                type="number"
                min="1"
                value={formData.advance_booking_days}
                onChange={(e) => setFormData({ ...formData, advance_booking_days: parseInt(e.target.value) || 30 })}
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
                checked={formData.same_day_booking_allowed}
                onCheckedChange={(checked) => setFormData({ ...formData, same_day_booking_allowed: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-confirm">Auto-Confirm Bookings</Label>
                <p className="text-xs text-muted-foreground">Automatically confirm bookings without manual approval</p>
              </div>
              <Switch
                id="auto-confirm"
                checked={formData.auto_confirm}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_confirm: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-phone">Require Phone Number</Label>
                <p className="text-xs text-muted-foreground">Make phone number mandatory for bookings</p>
              </div>
              <Switch
                id="require-phone"
                checked={formData.require_phone}
                onCheckedChange={(checked) => setFormData({ ...formData, require_phone: checked })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex gap-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            mode === "create" ? "Create Shop" : "Update Shop"
          )}
        </Button>
      </div>
    </div>
  )
}

