import { createClient } from "@/lib/supabase/server"
import { ShopDirectory } from "@/components/shop-directory"
import type { Metadata } from "next"
import { shopMatchesDiagnosis, sortShopsByRelevance } from "@/lib/utils/shop-matching"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixwise.vercel.app'

export const metadata: Metadata = {
  title: "Find Local Repair Shops Near You | FixWise",
  description: "Browse trusted repair shops for phone, laptop, and tablet repairs. Filter by expertise, location, and ratings. Verified repair professionals in your area. Find the best repair shop near you.",
  keywords: [
    "repair shops near me",
    "phone repair shops",
    "laptop repair near me",
    "local repair services",
    "verified repair shops",
    "device repair",
    "reparatiezaken",
    "telefoon reparatie",
    "laptop reparatie",
  ],
  openGraph: {
    title: "Find Local Repair Shops - FixWise",
    description: "Browse trusted repair shops for phone, laptop, and tablet repairs near you. Verified professionals with ratings and reviews.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["nl_NL"],
    url: `${baseUrl}/shops`,
    siteName: "FixWise",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "FixWise - Find Repair Shops",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Local Repair Shops - FixWise",
    description: "Browse trusted repair shops for phone, laptop, and tablet repairs near you.",
    images: [`${baseUrl}/logo.png`],
  },
  alternates: {
    canonical: `${baseUrl}/shops`,
    languages: {
      'en': `${baseUrl}/shops`,
      'nl': `${baseUrl}/shops`,
    },
  },
}

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnosis?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

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

  return <ShopDirectory shops={filteredShops} diagnosis={diagnosis} repairComponent={repairComponent} />
}
