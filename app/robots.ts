import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fixwise.be'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/shop/dashboard', '/shop/bookings', '/shop/products', '/shop/settings'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
