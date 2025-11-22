import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Mail, Star, Wrench, Package, Facebook, Instagram, Twitter, Globe, Info, Image as ImageIcon, ShoppingBag, MessageSquare, ArrowLeft, Calendar } from 'lucide-react'
import Link from "next/link"
import { ReviewList } from "@/components/review-list"
import { ReviewForm } from "@/components/review-form"
import { BookingDialog } from "@/components/booking-dialog"
import { ShopGallery } from "@/components/shop-gallery"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import { ShopDetailReviewCount } from "@/components/shop-detail-client"
import { 
  ShopDetailPriceRange, 
  ShopDetailServicesTitle, 
  ShopDetailProductsTitle, 
  ShopDetailReviewsSection
} from "@/components/shop-detail-translations"
import { ServiceProductCard } from "@/components/service-product-card"
import { getShopDetailMetadata, getLocaleFromHeaders } from "@/lib/i18n/metadata"
import { headers } from "next/headers"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fixwise.be'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const headersList = await headers()
  const locale = getLocaleFromHeaders(headersList)
  
  const { data: shop } = await supabase.from("repair_shops").select("*").eq("id", id).single()
  
  if (!shop) {
    return {
      title: locale === 'nl' ? "Zaak Niet Gevonden" : "Shop Not Found",
    }
  }

  return getShopDetailMetadata(shop, id, locale)
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch shop details
  const { data: shop, error: shopError } = await supabase.from("repair_shops").select("*").eq("id", id).single()

  if (shopError || !shop) {
    notFound()
  }

  let products: any[] = []
  const { data: productsData, error: productsError } = await supabase
    .from("shop_products")
    .select("*")
    .eq("shop_id", id)
    .eq("in_stock", true)
    .order("category", { ascending: false })
    .order("created_at", { ascending: false })
  
  // Only use products if the query succeeded (table exists)
  if (!productsError && productsData) {
    products = productsData
  }

  // Fetch reviews
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select(
      `
      *,
      user:users(name, email)
    `,
    )
    .eq("shop_id", id)
    .order("created_at", { ascending: false })

  const reviews = reviewsData || []

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile if authenticated
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    userProfile = profile
  }

  // Calculate review stats
  const totalReviews = reviews.length
  const averageRating = shop.rating || 0

  const services = products.filter((p) => p.category === "service")
  const shopProducts = products.filter((p) => p.category === "product")

  // Enhanced structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/shops/${id}`,
    name: shop.name,
    description: shop.description || `Professional repair services specializing in ${shop.expertise?.join(", ") || "device repair"}`,
    url: `${baseUrl}/shops/${id}`,
    image: shop.profile_image || shop.photo_url || `${baseUrl}/logo.png`,
    logo: shop.profile_image || shop.photo_url || `${baseUrl}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.address,
      addressLocality: shop.address.split(",")[0] || shop.address,
    },
    telephone: shop.phone || undefined,
    email: shop.email || undefined,
    aggregateRating: totalReviews > 0 ? {
      "@type": "AggregateRating",
      ratingValue: shop.rating || 0,
      reviewCount: totalReviews,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    priceRange: shop.price_range || undefined,
    areaServed: {
      "@type": "City",
      name: shop.address.split(",")[0] || shop.address,
    },
    knowsAbout: shop.expertise || [],
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: {
          "@type": "LocalBusiness",
          name: shop.name,
        },
      },
      price: service.price || undefined,
      priceCurrency: "USD",
    })),
    ...(shop.social_media && {
      sameAs: [
        shop.social_media.website,
        shop.social_media.facebook,
        shop.social_media.instagram,
        shop.social_media.twitter,
      ].filter(Boolean)
    }),
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Repair Shops",
        item: `${baseUrl}/shops`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: shop.name,
        item: `${baseUrl}/shops/${id}`,
      },
    ],
  }

  // Add Review structured data if reviews exist
  const reviewStructuredData = reviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "LocalBusiness",
      name: shop.name,
      "@id": `${baseUrl}/shops/${id}`
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: averageRating,
      bestRating: 5,
      worstRating: 1
    },
    reviewCount: totalReviews
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      {reviewStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewStructuredData),
          }}
        />
      )}
      <div className="min-h-screen bg-background">
        {/* Hero Section with Profile Image */}
        {shop.profile_image && (
          <div className="relative w-full h-64 md:h-80 lg:h-96">
            <Image
              src={shop.profile_image}
              alt={shop.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
          </div>
        )}

        <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/shops" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Shops</span>
            </Link>
            <BookingDialog 
              shopId={id}
              shopName={shop.name}
              userEmail={userProfile?.email}
              userName={userProfile?.name}
              trigger={
                <a className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Calendar className="h-4 w-4" />
                  <span>Book Appointment</span>
                </a>
              }
            />
          </div>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto">
              {/* Shop Header Card */}
              <Card className="border-2 mb-6">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-bold mb-2">{shop.name}</h1>
                      <CardTitle className="sr-only">{shop.name} - Repair Services</CardTitle>
                      {shop.bio && (
                        <p className="text-lg text-muted-foreground mb-4">{shop.bio}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.round(averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <ShopDetailReviewCount count={totalReviews} averageRating={averageRating} />
                        {shop.price_range && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <ShopDetailPriceRange priceRange={shop.price_range} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Contact Information */}
                  <div className="grid gap-4 sm:grid-cols-2 border-t pt-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                        <p className="text-base">{shop.address}</p>
                      </div>
                    </div>
                    {shop.phone && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                          <a href={`tel:${shop.phone}`} className="text-base hover:text-primary transition-colors">
                            {shop.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                          <a href={`mailto:${shop.email}`} className="text-base hover:text-primary transition-colors break-all">
                            {shop.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Content */}
              <Tabs defaultValue="overview" className="w-full">
                <div className="overflow-x-auto -mx-4 px-4 mb-6">
                  <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
                    <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
                      <Info className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                      <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    {shop.gallery_images && shop.gallery_images.length > 0 && (
                      <TabsTrigger value="gallery" className="flex items-center gap-2 whitespace-nowrap">
                        <ImageIcon className="h-4 w-4" />
                        <span>Gallery</span>
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="services" className="flex items-center gap-2 whitespace-nowrap">
                      <Wrench className="h-4 w-4" />
                      <span>Services</span>
                      {services.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {services.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center gap-2 whitespace-nowrap">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Products</span>
                      {shopProducts.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {shopProducts.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2 whitespace-nowrap">
                      <MessageSquare className="h-4 w-4" />
                      <span>Reviews</span>
                      {totalReviews > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {totalReviews}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Expertise Tags */}
                  {shop.expertise && shop.expertise.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Expertise
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {shop.expertise.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description */}
                  {shop.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">About Us</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{shop.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Media Links */}
                  {(shop.social_media?.website || shop.social_media?.facebook || shop.social_media?.instagram || shop.social_media?.twitter) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Follow Us</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-3">
                          {shop.social_media?.website && (
                            <a
                              href={shop.social_media.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                              <span className="text-sm font-medium">Website</span>
                            </a>
                          )}
                          {shop.social_media?.facebook && (
                            <a
                              href={shop.social_media.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Facebook className="h-4 w-4" />
                              <span className="text-sm font-medium">Facebook</span>
                            </a>
                          )}
                          {shop.social_media?.instagram && (
                            <a
                              href={shop.social_media.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Instagram className="h-4 w-4" />
                              <span className="text-sm font-medium">Instagram</span>
                            </a>
                          )}
                          {shop.social_media?.twitter && (
                            <a
                              href={shop.social_media.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Twitter className="h-4 w-4" />
                              <span className="text-sm font-medium">Twitter</span>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Gallery Tab */}
                {shop.gallery_images && shop.gallery_images.length > 0 && (
                  <TabsContent value="gallery">
                    <ShopGallery images={shop.gallery_images} shopName={shop.name} />
                  </TabsContent>
                )}

                {/* Services Tab */}
                <TabsContent value="services">
                  <Card>
                    <CardHeader>
                      <ShopDetailServicesTitle />
                    </CardHeader>
                    <CardContent>
                      {services.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {services.map((service) => (
                            <ServiceProductCard
                              key={service.id}
                              id={service.id}
                              name={service.name}
                              description={service.description}
                              price={service.price}
                              image_url={service.image_url}
                              category="service"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No services available at this time.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <ShopDetailProductsTitle />
                    </CardHeader>
                    <CardContent>
                      {shopProducts.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {shopProducts.map((product) => (
                            <ServiceProductCard
                              key={product.id}
                              id={product.id}
                              name={product.name}
                              description={product.description}
                              price={product.price}
                              image_url={product.image_url}
                              category="product"
                              in_stock={product.in_stock}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No products available at this time.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="space-y-6">
                  {user && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Write a Review</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ReviewForm shopId={id} />
                      </CardContent>
                    </Card>
                  )}
                  {!user && (
                    <Card>
                      <CardContent className="py-6 text-center">
                        <p className="mb-4 text-sm text-muted-foreground">Please log in to write a review</p>
                        <Button asChild>
                          <Link href="/auth/login">Log In</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  <ShopDetailReviewsSection reviews={reviews} />
                </TabsContent>
              </Tabs>
          </div>
        </div>
      </div>
    </>
  )
}
