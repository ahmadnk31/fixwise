import { createClient } from "@/lib/supabase/server"
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixwise.vercel.app'

  // Get all shops for dynamic URLs
  const { data: shops } = await supabase.from('repair_shops').select('id, created_at, updated_at')

  const shopUrls = (shops || []).map((shop) => ({
    url: `${baseUrl}/shops/${shop.id}`,
    lastModified: shop.updated_at ? new Date(shop.updated_at) : new Date(shop.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: {
      languages: {
        en: `${baseUrl}/shops/${shop.id}`,
        nl: `${baseUrl}/shops/${shop.id}`,
      },
    },
  }))

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
      alternates: {
        languages: {
          en: baseUrl,
          nl: baseUrl,
        },
      },
    },
    {
      url: `${baseUrl}/shops`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/shops`,
          nl: `${baseUrl}/shops`,
        },
      },
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: {
        languages: {
          en: `${baseUrl}/auth/login`,
          nl: `${baseUrl}/auth/login`,
        },
      },
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: {
        languages: {
          en: `${baseUrl}/auth/sign-up`,
          nl: `${baseUrl}/auth/sign-up`,
        },
      },
    },
  ]

  return [...staticPages, ...shopUrls]
}
