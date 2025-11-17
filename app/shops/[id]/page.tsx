import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Star, Wrench, Package, Facebook, Instagram, Twitter, Globe } from 'lucide-react'
import Link from "next/link"
import { ReviewList } from "@/components/review-list"
import { ReviewForm } from "@/components/review-form"
import { BookingForm } from "@/components/booking-form"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import { ShopDetailBackLink, ShopDetailReviewCount } from "@/components/shop-detail-client"
import { 
  ShopDetailPriceRange, 
  ShopDetailServicesTitle, 
  ShopDetailProductsTitle, 
  ShopDetailReviewsSection, 
  ShopDetailSignInPrompt 
} from "@/components/shop-detail-translations"
import { ServiceProductCard } from "@/components/service-product-card"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixwise.vercel.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: shop } = await supabase.from("repair_shops").select("*").eq("id", id).single()
  
  if (!shop) {
    return {
      title: "Shop Not Found",
    }
  }

  const expertiseList = shop.expertise?.slice(0, 5).join(", ") || "device repair"
  const description = `${shop.name} - Professional repair services in ${shop.address}. Specializing in ${expertiseList}. ${shop.rating ? `Rating: ${shop.rating}/5.` : ''} Book your repair appointment today.`
  const keywords = [
    ...(shop.expertise || []),
    "repair shop",
    "phone repair",
    "laptop repair",
    "device repair",
    shop.name,
    shop.address,
    "reparatiezaak",
    "telefoon reparatie",
    "laptop reparatie",
  ]

  return {
    title: `${shop.name} - Repair Services & Reviews | FixWise`,
    description,
    keywords,
    openGraph: {
      title: `${shop.name} - Professional Repair Services`,
      description,
      type: "website",
      locale: "en_US",
      alternateLocale: ["nl_NL"],
      url: `${baseUrl}/shops/${id}`,
      siteName: "FixWise",
      images: shop.photo_url ? [
        {
          url: shop.photo_url,
          width: 1200,
          height: 630,
          alt: `${shop.name} - Repair Shop`,
        }
      ] : [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: `${shop.name} - Repair Shop`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${shop.name} - Professional Repair Services`,
      description,
      images: shop.photo_url ? [shop.photo_url] : [`${baseUrl}/logo.png`],
    },
    alternates: {
      canonical: `${baseUrl}/shops/${id}`,
      languages: {
        'en': `${baseUrl}/shops/${id}`,
        'nl': `${baseUrl}/shops/${id}`,
      },
    },
  }
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
    description: `Professional repair services specializing in ${shop.expertise?.join(", ") || "device repair"}`,
    url: `${baseUrl}/shops/${id}`,
    image: shop.photo_url || `${baseUrl}/logo.png`,
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
      name: shop.address,
    },
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
          <ShopDetailBackLink />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shop Header Card */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl md:text-4xl font-bold mb-2">{shop.name}</CardTitle>
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
                <CardContent className="space-y-6">
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

                  {/* Expertise Tags */}
                  {shop.expertise && shop.expertise.length > 0 && (
                    <div className="border-t pt-6">
                      <div className="flex items-start gap-3 mb-3">
                        <Wrench className="h-5 w-5 text-primary mt-0.5" />
                        <p className="text-sm font-semibold text-muted-foreground">Expertise</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {shop.expertise.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Media Links */}
                  {(shop.social_media?.website || shop.social_media?.facebook || shop.social_media?.instagram || shop.social_media?.twitter) && (
                    <div className="border-t pt-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">Follow Us</p>
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
                    </div>
                  )}
                </CardContent>
              </Card>

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

              {/* Gallery */}
              {shop.gallery_images && shop.gallery_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {shop.gallery_images.map((imageUrl: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group cursor-pointer">
                          <Image
                            src={imageUrl}
                            alt={`${shop.name} gallery image ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              {services.length > 0 && (
                <Card>
                  <CardHeader>
                    <ShopDetailServicesTitle />
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              )}

              {/* Products */}
              {shopProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <ShopDetailProductsTitle />
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <ShopDetailReviewsSection reviews={reviews} />
            </div>

            {/* Right Sidebar - Sticky */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-6">
                <BookingForm shopId={id} shopName={shop.name} userEmail={userProfile?.email} userName={userProfile?.name} />

                {user && <ReviewForm shopId={id} />}
                {!user && (
                  <ShopDetailSignInPrompt />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
