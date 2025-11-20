import { createClient } from "@/lib/supabase/server"
import { ShopDirectory } from "@/components/shop-directory"
import type { Metadata } from "next"
import { shopMatchesDiagnosis, sortShopsByRelevance } from "@/lib/utils/shop-matching"
import { getShopsPageMetadata, getLocaleFromHeaders } from "@/lib/i18n/metadata"
import { headers } from "next/headers"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fixwise.be'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = getLocaleFromHeaders(headersList)
  return getShopsPageMetadata(locale)
}

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnosis?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Enhanced structured data for shops page
  const shopsStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Repair Shops Directory",
    description: "Find trusted local repair shops for phone, laptop, and tablet repairs",
    url: `${baseUrl}/shops`,
    numberOfItems: 0, // Will be updated dynamically
    itemListElement: [] as any[]
  }

  // Fetch diagnosis if provided
  let diagnosis = null
  let repairComponent = null
  
  if (params.diagnosis) {
    const { data: diagnosisData } = await supabase.from("diagnoses").select("*").eq("id", params.diagnosis).single()
    diagnosis = diagnosisData
    
    if (diagnosis?.ai_response?.repair_component) {
      repairComponent = diagnosis.ai_response.repair_component.toLowerCase()
    }
  }

  // Fetch all shops
  const { data: shops, error } = await supabase
    .from("repair_shops")
    .select("*")

  // Fetch all services/products for shops
  const { data: allProducts } = await supabase
    .from("shop_products")
    .select("*")
    .eq("category", "service")

  // Group products by shop_id
  const productsByShop = new Map<string, any[]>()
  if (allProducts) {
    allProducts.forEach((product: any) => {
      if (!productsByShop.has(product.shop_id)) {
        productsByShop.set(product.shop_id, [])
      }
      productsByShop.get(product.shop_id)!.push(product)
    })
  }

  // Attach products to shops
  const shopsWithProducts = (shops || []).map(shop => ({
    ...shop,
    shop_products: productsByShop.get(shop.id) || []
  }))

  if (error) {
    console.error("Error fetching shops:", error)
  }

  let filteredShops = shopsWithProducts || []
  
  // Use smart matching if diagnosis is available
  if (diagnosis?.ai_response) {
    const diagnosisMatch = {
      device_brand: diagnosis.ai_response.device_brand,
      device_type: diagnosis.ai_response.device_type,
      repair_component: diagnosis.ai_response.repair_component,
      repair_keywords: diagnosis.ai_response.repair_keywords,
    }
    
    // Filter shops that match the diagnosis (checking both expertise and services)
    filteredShops = filteredShops.filter(shop => {
      const services = (shop.shop_products || []).filter((p: any) => p.category === "service" && p.in_stock !== false)
      const matchResult = shopMatchesDiagnosis(
        shop.expertise || [], 
        diagnosisMatch,
        services
      )
      return matchResult.matches
    })
    
    // Sort by relevance (match score, then rating, then distance)
    filteredShops = sortShopsByRelevance(filteredShops, diagnosisMatch)
    
    // If no matches found, fall back to broader matching
    if (filteredShops.length === 0 && repairComponent) {
      const allShops = shopsWithProducts || []
      filteredShops = allShops.filter(shop => {
        const expertise = (shop.expertise || []).map((e: string) => e.toLowerCase())
        const services = (shop.shop_products || [])
          .filter((p: any) => p.category === "service")
          .map((p: any) => `${p.name} ${p.description || ""} ${p.type || ""}`.toLowerCase())
        const component = repairComponent.toLowerCase()
        
        // Check expertise
        const expertiseMatch = expertise.some((exp: string) => 
          exp.includes(component) || 
          component.includes(exp) ||
          (diagnosisMatch.device_brand && exp.includes(diagnosisMatch.device_brand.toLowerCase()))
        )
        
        // Check services
        const serviceMatch = services.some((serviceText: string) =>
          serviceText.includes(component) ||
          component.includes(serviceText) ||
          (diagnosisMatch.device_brand && serviceText.includes(diagnosisMatch.device_brand.toLowerCase()))
        )
        
        return expertiseMatch || serviceMatch
      })
      
      // Sort by rating
      filteredShops.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
  } else {
    // No diagnosis - just sort by rating
    filteredShops.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }

  // Update structured data with shop count
  shopsStructuredData.numberOfItems = filteredShops.length
  shopsStructuredData.itemListElement = filteredShops.slice(0, 10).map((shop, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "LocalBusiness",
      name: shop.name,
      url: `${baseUrl}/shops/${shop.id}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: shop.address
      }
    }
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(shopsStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: baseUrl
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Repair Shops",
                item: `${baseUrl}/shops`
              }
            ]
          }),
        }}
      />
      <ShopDirectory shops={filteredShops} diagnosis={diagnosis} repairComponent={repairComponent} />
    </>
  )
}
