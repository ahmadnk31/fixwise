"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Wrench, LogOut, X, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, Facebook, Instagram, Twitter, Globe, Store, FileText, Share2, Building2, Calendar } from 'lucide-react'
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import type { User } from "@supabase/supabase-js"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useGoogleMaps } from "@/lib/hooks/use-google-maps"
import { useDropzone } from "react-dropzone"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShopSettingsProps {
  user: User
  shop: any
  isAdmin?: boolean // Allow admin access to edit any shop
}

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

export function ShopSettings({ user, shop, isAdmin = false }: ShopSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  const [formData, setFormData] = useState({
    name: shop?.name || "",
    email: shop?.email || user.email || "",
    phone: shop?.phone || "",
    address: shop?.address || "",
    priceRange: shop?.price_range || "$$",
    latitude: shop?.latitude || null,
    longitude: shop?.longitude || null,
  })

  const [businessDetails, setBusinessDetails] = useState({
    businessName: shop?.business_name || "",
    vatNumber: shop?.vat_number || "",
    companyRegistration: shop?.company_registration || "",
    businessAddress: shop?.business_address || "",
    businessCountry: shop?.business_country || "",
    businessType: shop?.business_type || "company",
  })

  const [vatValidation, setVatValidation] = useState<{
    isValidating: boolean
    isValid: boolean | null
    message: string | null
    companyName: string | null
  }>({
    isValidating: false,
    isValid: shop?.vat_validated || null,
    message: null,
    companyName: null,
  })

  const [expertise, setExpertise] = useState<string[]>(shop?.expertise || [])
  const [newExpertise, setNewExpertise] = useState("")
  const { isLoaded: mapsLoaded } = useGoogleMaps()

  // Profile and gallery images
  const [profileImage, setProfileImage] = useState<string | null>(shop?.profile_image || null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(shop?.profile_image || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(shop?.gallery_images || [])
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([])
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>(shop?.gallery_images || [])

  // Bio and description
  const [bio, setBio] = useState(shop?.bio || "")
  const [description, setDescription] = useState(shop?.description || "")

  // Social media
  const [socialMedia, setSocialMedia] = useState({
    facebook: shop?.social_media?.facebook || "",
    instagram: shop?.social_media?.instagram || "",
    twitter: shop?.social_media?.twitter || "",
    website: shop?.social_media?.website || "",
  })

  const [bookingPrefs, setBookingPrefs] = useState({
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
    delivery_pickup_fee: shop?.booking_preferences?.delivery_pricing?.pickup || 0,
    delivery_home_fee: shop?.booking_preferences?.delivery_pricing?.home || 15,
    delivery_mail_fee: shop?.booking_preferences?.delivery_pricing?.mail || 25,
  })

  useEffect(() => {
    if (mapsLoaded && window.google?.maps && !autocompleteRef.current) {
        initializeAutocomplete()
    }
  }, [mapsLoaded])

  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !window.google || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "geometry"],
    })

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace()

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        setFormData({
          ...formData,
          address: place.formatted_address || "",
          latitude: lat,
          longitude: lng,
        })
      }
    })
  }

  const validateVAT = async () => {
    if (!businessDetails.vatNumber || !businessDetails.businessCountry) {
      setVatValidation({
        isValidating: false,
        isValid: false,
        message: "Please enter VAT number and select country",
        companyName: null,
      })
      return
    }

    setVatValidation({
      isValidating: true,
      isValid: null,
      message: "Validating VAT number...",
      companyName: null,
    })

    try {
      const response = await fetch("/api/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vatNumber: businessDetails.vatNumber,
          countryCode: businessDetails.businessCountry,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        setVatValidation({
          isValidating: false,
          isValid: true,
          message: "VAT number validated successfully!",
          companyName: data.name || null,
        })
        // Auto-fill business name if returned from VIES
        if (data.name && !businessDetails.businessName) {
          setBusinessDetails({
            ...businessDetails,
            businessName: data.name,
          })
        }
      } else {
        setVatValidation({
          isValidating: false,
          isValid: false,
          message: data.error || "VAT number is invalid",
          companyName: null,
        })
      }
    } catch (error) {
      setVatValidation({
        isValidating: false,
        isValid: false,
        message: "Error validating VAT number. Please try again.",
        companyName: null,
      })
    }
  }

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()])
      setNewExpertise("")
    }
  }

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Upload profile image if new one is selected
      let profileImageUrl = profileImage
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split(".").pop()
        const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

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
      for (const file of galleryImageFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

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

      const shopData = {
        owner_id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        price_range: formData.priceRange,
        expertise,
        business_name: businessDetails.businessName || null,
        vat_number: businessDetails.vatNumber || null,
        company_registration: businessDetails.companyRegistration || null,
        business_address: businessDetails.businessAddress || null,
        business_country: businessDetails.businessCountry || null,
        vat_validated: vatValidation.isValid || false,
        business_type: businessDetails.businessType || null,
        profile_image: profileImageUrl,
        gallery_images: [...galleryImages, ...newGalleryUrls],
        bio: bio.trim() || null,
        description: description.trim() || null,
        social_media: {
          facebook: socialMedia.facebook.trim() || null,
          instagram: socialMedia.instagram.trim() || null,
          twitter: socialMedia.twitter.trim() || null,
          website: socialMedia.website.trim() || null,
        },
        booking_preferences: {
          max_bookings_per_day: bookingPrefs.max_bookings_per_day,
          max_bookings_per_slot: bookingPrefs.max_bookings_per_slot,
          working_hours: {
            start: bookingPrefs.working_hours_start,
            end: bookingPrefs.working_hours_end,
          },
          slot_duration_minutes: bookingPrefs.slot_duration_minutes,
          buffer_time_minutes: bookingPrefs.buffer_time_minutes,
          advance_booking_days: bookingPrefs.advance_booking_days,
          same_day_booking_allowed: bookingPrefs.same_day_booking_allowed,
          auto_confirm: bookingPrefs.auto_confirm,
          require_phone: bookingPrefs.require_phone,
          delivery_pricing: {
            pickup: bookingPrefs.delivery_pickup_fee || 0,
            home: bookingPrefs.delivery_home_fee || 15,
            mail: bookingPrefs.delivery_mail_fee || 25,
          },
        },
      }

      if (shop) {
        const { error: updateError } = await supabase.from("repair_shops").update(shopData).eq("id", shop.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("repair_shops").insert(shopData)

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        if (isAdmin) {
          router.push("/admin")
        } else {
          router.push("/shop/dashboard")
        }
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isEUCountry = EU_COUNTRIES.some((c) => c.code === businessDetails.businessCountry)

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Shop Settings</h1>
          <p className="text-muted-foreground">{shop ? "Update your shop information" : "Create your shop profile"}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{shop ? "Edit Shop" : "Create Shop"}</CardTitle>
                <CardDescription>
                  {isAdmin ? `Managing settings for ${shop?.name || "shop"}` : "Manage your repair shop listing"}
                </CardDescription>
              </div>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Back to Admin
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <div className="overflow-x-auto -mx-4 px-4 mb-6">
                  <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
                    <TabsTrigger value="basic" className="flex items-center gap-2 whitespace-nowrap">
                      <Store className="h-4 w-4" />
                      <span>Basic</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2 whitespace-nowrap">
                      <ImageIcon className="h-4 w-4" />
                      <span>Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex items-center gap-2 whitespace-nowrap">
                      <FileText className="h-4 w-4" />
                      <span>About</span>
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2 whitespace-nowrap">
                      <Share2 className="h-4 w-4" />
                      <span>Social</span>
                    </TabsTrigger>
                    <TabsTrigger value="business" className="flex items-center gap-2 whitespace-nowrap">
                      <Building2 className="h-4 w-4" />
                      <span>Business</span>
                    </TabsTrigger>
                    <TabsTrigger value="booking" className="flex items-center gap-2 whitespace-nowrap">
                      <Calendar className="h-4 w-4" />
                      <span>Booking</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="TechFix Pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@techfix.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="555-0123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  ref={addressInputRef}
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Start typing your address..."
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Start typing and select from the dropdown to automatically set your location on the map
                </p>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-green-600">
                    ✓ Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range</Label>
                <select
                  id="priceRange"
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Premium</option>
                </select>
              </div>

              <div className="space-y-2">
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
                  {expertise.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1">
                      {item}
                      <button type="button" onClick={() => removeExpertise(item)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
                </TabsContent>

                {/* Profile & Gallery Tab */}
                <TabsContent value="profile" className="space-y-6">
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

                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">About Your Shop</h3>
                    <p className="text-sm text-muted-foreground">Tell customers about your shop</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Short Description)</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A brief introduction to your shop..."
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground">{bio.length}/200 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed information about your shop, services, experience, etc..."
                      rows={6}
                    />
                  </div>
                </TabsContent>

                {/* Social Media Tab */}
                <TabsContent value="social" className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Social Media & Website</h3>
                    <p className="text-sm text-muted-foreground">Connect your social media profiles</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={socialMedia.website}
                        onChange={(e) => setSocialMedia({ ...socialMedia, website: e.target.value })}
                        placeholder="https://yourshop.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={socialMedia.facebook}
                        onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                        placeholder="https://facebook.com/yourshop"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={socialMedia.instagram}
                        onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                        placeholder="https://instagram.com/yourshop"
                      />
              </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter / X
                      </Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={socialMedia.twitter}
                        onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                        placeholder="https://twitter.com/yourshop"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Business Details Tab */}
                <TabsContent value="business" className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="text-lg font-semibold">Business Details</h3>
                  <p className="text-sm text-muted-foreground">Required for EU-based businesses</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCountry">Country</Label>
                  <select
                    id="businessCountry"
                    value={businessDetails.businessCountry}
                    onChange={(e) =>
                      setBusinessDetails({ ...businessDetails, businessCountry: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select country</option>
                    {EU_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isEUCountry && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <select
                        id="businessType"
                        value={businessDetails.businessType}
                        onChange={(e) =>
                          setBusinessDetails({ ...businessDetails, businessType: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="company">Company</option>
                        <option value="individual">Individual/Sole Trader</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">Legal Business Name *</Label>
                      <Input
                        id="businessName"
                        required={isEUCountry}
                        value={businessDetails.businessName}
                        onChange={(e) =>
                          setBusinessDetails({ ...businessDetails, businessName: e.target.value })
                        }
                        placeholder="TechFix Solutions GmbH"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">VAT Number *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="vatNumber"
                          required={isEUCountry}
                          value={businessDetails.vatNumber}
                          onChange={(e) =>
                            setBusinessDetails({ ...businessDetails, vatNumber: e.target.value })
                          }
                          placeholder="DE123456789"
                        />
                        <Button
                          type="button"
                          onClick={validateVAT}
                          disabled={vatValidation.isValidating || !businessDetails.vatNumber}
                          variant="outline"
                        >
                          {vatValidation.isValidating ? "Validating..." : "Validate"}
                        </Button>
                      </div>
                      {vatValidation.message && (
                        <Alert variant={vatValidation.isValid ? "default" : "destructive"}>
                          {vatValidation.isValid ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertDescription>{vatValidation.message}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyRegistration">Company Registration Number</Label>
                      <Input
                        id="companyRegistration"
                        value={businessDetails.companyRegistration}
                        onChange={(e) =>
                          setBusinessDetails({ ...businessDetails, companyRegistration: e.target.value })
                        }
                        placeholder="HRB 12345"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Registered Business Address *</Label>
                      <Input
                        id="businessAddress"
                        required={isEUCountry}
                        value={businessDetails.businessAddress}
                        onChange={(e) =>
                          setBusinessDetails({ ...businessDetails, businessAddress: e.target.value })
                        }
                        placeholder="123 Business Street, City"
                      />
                    </div>
                  </>
                )}
              </div>
                </TabsContent>

                {/* Booking Preferences Tab */}
                <TabsContent value="booking" className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Booking Preferences</h3>
                    <p className="text-sm text-muted-foreground">Configure how customers can book appointments with your shop</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxBookingsPerDay">Max Bookings Per Day</Label>
                      <Input
                        id="maxBookingsPerDay"
                        type="number"
                        min="1"
                        value={bookingPrefs.max_bookings_per_day}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, max_bookings_per_day: parseInt(e.target.value) || 10 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxBookingsPerSlot">Max Bookings Per Time Slot</Label>
                      <Input
                        id="maxBookingsPerSlot"
                        type="number"
                        min="1"
                        value={bookingPrefs.max_bookings_per_slot}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, max_bookings_per_slot: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                      <Input
                        id="workingHoursStart"
                        type="time"
                        value={bookingPrefs.working_hours_start}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, working_hours_start: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                      <Input
                        id="workingHoursEnd"
                        type="time"
                        value={bookingPrefs.working_hours_end}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, working_hours_end: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                      <Input
                        id="slotDuration"
                        type="number"
                        min="15"
                        step="15"
                        value={bookingPrefs.slot_duration_minutes}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, slot_duration_minutes: parseInt(e.target.value) || 30 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bufferTime">Buffer Time Between Bookings (minutes)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        min="0"
                        value={bookingPrefs.buffer_time_minutes}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, buffer_time_minutes: parseInt(e.target.value) || 15 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="advanceBookingDays">Advance Booking Limit (days)</Label>
                      <Input
                        id="advanceBookingDays"
                        type="number"
                        min="1"
                        value={bookingPrefs.advance_booking_days}
                        onChange={(e) =>
                          setBookingPrefs({ ...bookingPrefs, advance_booking_days: parseInt(e.target.value) || 30 })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sameDayBooking">Allow Same-Day Bookings</Label>
                        <p className="text-xs text-muted-foreground">Allow customers to book appointments for today</p>
                      </div>
                      <Switch
                        id="sameDayBooking"
                        checked={bookingPrefs.same_day_booking_allowed}
                        onCheckedChange={(checked) =>
                          setBookingPrefs({ ...bookingPrefs, same_day_booking_allowed: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoConfirm">Auto-Confirm Bookings</Label>
                        <p className="text-xs text-muted-foreground">Automatically confirm bookings without manual approval</p>
                      </div>
                      <Switch
                        id="autoConfirm"
                        checked={bookingPrefs.auto_confirm}
                        onCheckedChange={(checked) =>
                          setBookingPrefs({ ...bookingPrefs, auto_confirm: checked })
                        }
                      />
              </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requirePhone">Require Phone Number</Label>
                        <p className="text-xs text-muted-foreground">Make phone number mandatory for bookings</p>
                      </div>
                      <Switch
                        id="requirePhone"
                        checked={bookingPrefs.require_phone}
                        onCheckedChange={(checked) =>
                          setBookingPrefs({ ...bookingPrefs, require_phone: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 rounded-lg border p-4">
                    <div>
                      <h4 className="mb-1 text-base font-semibold">Delivery & Shipping Pricing</h4>
                      <p className="text-xs text-muted-foreground">Set pricing for different delivery options</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="pickupFee">Pickup at Store Fee ($)</Label>
                        <Input
                          id="pickupFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={bookingPrefs.delivery_pickup_fee}
                          onChange={(e) =>
                            setBookingPrefs({ ...bookingPrefs, delivery_pickup_fee: parseFloat(e.target.value) || 0 })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Usually $0 (free)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="homeDeliveryFee">Home Delivery Fee ($)</Label>
                        <Input
                          id="homeDeliveryFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={bookingPrefs.delivery_home_fee}
                          onChange={(e) =>
                            setBookingPrefs({ ...bookingPrefs, delivery_home_fee: parseFloat(e.target.value) || 15 })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Fee for home delivery service</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mailFee">Mail/Shipping Fee ($)</Label>
                        <Input
                          id="mailFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={bookingPrefs.delivery_mail_fee}
                          onChange={(e) =>
                            setBookingPrefs({ ...bookingPrefs, delivery_mail_fee: parseFloat(e.target.value) || 25 })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Fee for shipping by mail</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submit Button - Outside tabs but inside form */}
              <div className="mt-6 pt-6 border-t">
                {error && <p className="text-sm text-destructive mb-4">{error}</p>}
                {success && <p className="text-sm text-green-600 mb-4">Shop saved successfully! Redirecting...</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
