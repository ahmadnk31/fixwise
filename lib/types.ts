export interface DiagnosisResult {
  device_brand?: string // Device brand (e.g., "OnePlus", "iPhone", "Samsung")
  device_type?: string // Full device model (e.g., "OnePlus 12", "iPhone 12")
  repair_component?: string // Specific part needing repair (e.g., "screen", "battery")
  repair_keywords?: string[] // Alternative keywords for matching (e.g., ["screen", "display", "LCD"])
  probable_issue: string
  likely_cause: string
  repair_difficulty: string
  recommended_action: string
  estimated_cost: string
}

export interface RepairShop {
  id: string
  owner_id: string
  name: string
  email: string
  phone: string | null
  address: string
  latitude: number | null
  longitude: number | null
  expertise: string[]
  price_range: string | null
  rating: number
  created_at: string
  distance?: number
  business_name?: string | null
  vat_number?: string | null
  company_registration?: string | null
  business_address?: string | null
  business_country?: string | null
  vat_validated?: boolean
  business_type?: string | null
}

export interface Diagnosis {
  id: string
  user_id: string | null
  user_input: string
  ai_response: DiagnosisResult
  photo_url: string | null
  estimated_cost: string | null
  created_at: string
}

export interface Lead {
  id: string
  diagnosis_id: string
  shop_id: string
  status: "pending" | "accepted" | "completed"
  created_at: string
}

export interface IFixitGuide {
  guideid: number
  title: string
  subject: string
  summary: string
  difficulty: string
  time_required: string
  tools: Array<{ text: string }>
  parts: Array<{ text: string; url: string }>
  steps: Array<{
    title: string
    lines: Array<{
      text_raw: string
      text_rendered: string
      level: number
    }>
    media: {
      type: string
      data: Array<{
        id: number
        guid: string
        mini: string
        thumbnail: string
        standard: string
        medium: string
        large: string
        original: string
      }>
    }
  }>
  conclusion_raw: string
  conclusion_rendered: string
  image: {
    id: number
    guid: string
    mini: string
    thumbnail: string
    standard: string
    medium: string
    large: string
    original: string
  }
}

export interface IFixitSearchResult {
  guideid: number
  title: string
  subject: string
  summary: string
  difficulty: string
  image_url: string
  url: string
}

export interface Review {
  id: string
  shop_id: string
  user_id: string | null
  rating: number
  comment: string | null
  photos: string[] | null
  created_at: string
  user?: {
    name: string
    email: string
  }
}

export interface Booking {
  id: string
  user_id: string | null
  shop_id: string
  diagnosis_id: string | null
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes: string | null
  user_name: string
  user_email: string
  user_phone: string | null
  created_at: string
  updated_at: string
  shop?: RepairShop
  diagnosis?: Diagnosis
}

export interface ShopProduct {
  id: string
  shop_id: string
  name: string
  description: string | null
  category: "product" | "service"
  type: string | null
  price: number | null
  image_url: string | null
  in_stock: boolean
  created_at: string
  updated_at: string
}
