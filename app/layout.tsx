import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { I18nProvider } from "@/lib/i18n/context"

import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixwise.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FixWise - AI-Powered Repair Diagnosis & Local Repair Shop Directory",
    template: "%s | FixWise"
  },
  description: "Get instant AI-powered repair diagnosis for your phone, laptop, or tablet. Connect with trusted local repair shops near you. Free diagnosis, expert recommendations, and verified repair professionals.",
  keywords: ["phone repair", "laptop repair", "AI diagnosis", "repair shops", "device repair", "screen replacement", "battery replacement", "electronics repair", "local repair shops", "telefoon reparatie", "laptop reparatie", "reparatiezaken"],
  authors: [{ name: "FixWise" }],
  creator: "FixWise",
  publisher: "FixWise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["nl_NL"],
    url: "/",
    title: "FixWise - AI-Powered Repair Diagnosis & Local Repair Shop Directory",
    description: "Get instant AI-powered repair diagnosis for your device and connect with trusted local repair shops.",
    siteName: "FixWise",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "FixWise - AI Repair Diagnosis Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FixWise - AI-Powered Repair Diagnosis",
    description: "Get instant AI diagnosis for your device and find trusted repair shops nearby.",
    images: ["/logo.png"],
    creator: "@fixwise",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: "/",
    languages: {
      'en': '/',
      'nl': '/',
      'x-default': '/',
    },
  },
  generator: "Next.js",
  applicationName: "FixWise",
  referrer: "origin-when-cross-origin",
  category: "technology",
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/`} />
        <link rel="alternate" hrefLang="nl" href={`${baseUrl}/`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "FixWise",
              description: "AI-Powered Repair Diagnosis and Local Repair Shop Directory",
              url: baseUrl,
              logo: `${baseUrl}/logo.png`,
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                availableLanguage: ["English", "Dutch", "Nederlands"]
              },
              areaServed: {
                "@type": "Country",
                name: "Worldwide"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FixWise",
              url: baseUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${baseUrl}/shops?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
