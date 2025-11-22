import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { I18nProvider } from "@/lib/i18n/context"
import { getMetadataForLocale, getLocaleFromHeaders } from "@/lib/i18n/metadata"
import { headers } from "next/headers"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fixwise.be'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = getLocaleFromHeaders(headersList)
  const metadata = getMetadataForLocale(locale)
  
  return {
    ...metadata,
    metadataBase: new URL(baseUrl),
    authors: [{ name: "FixWise" }],
    creator: "FixWise",
    publisher: "FixWise",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
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
    generator: "Next.js",
    applicationName: "FixWise",
    referrer: "origin-when-cross-origin",
    category: "technology",
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const locale = getLocaleFromHeaders(headersList)
  
  const serviceDescription = locale === 'nl' 
    ? "Gratis AI-gestuurde reparatiediagnose voor telefoons, laptops en tablets. Krijg directe expertaanbevelingen en verbind met geverifieerde lokale reparatiezaken."
    : "Free AI-powered repair diagnosis for phones, laptops, and tablets. Get instant expert recommendations and connect with verified local repair shops."
  
  const faqData = locale === 'nl' ? [
    {
      "@type": "Question",
      name: "Hoe werkt AI-reparatiediagnose?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Beschrijf eenvoudig uw apparaatprobleem of upload een foto. Onze AI analyseert het probleem en biedt directe diagnose met reparatieaanbevelingen, geschatte kosten en verbindt u met geverifieerde lokale reparatiezaken."
      }
    },
    {
      "@type": "Question",
      name: "Is de reparatiediagnose gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, onze AI-gestuurde reparatiediagnose is volledig gratis. U kunt directe analyse krijgen voor uw telefoon, laptop of tablet zonder enige kosten."
      }
    },
    {
      "@type": "Question",
      name: "Welke apparaten kunnen worden gediagnosticeerd?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We ondersteunen diagnose voor iPhones, Android-telefoons, MacBooks, Windows-laptops, tablets en andere elektronische apparaten. Onze AI kan helpen bij schermreparaties, batterijvervangingen, softwareproblemen en meer."
      }
    },
    {
      "@type": "Question",
      name: "Hoe vind ik een reparatiezaak bij mij in de buurt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Na het krijgen van uw diagnose, tonen we u geverifieerde reparatiezaken in uw omgeving die gespecialiseerd zijn in uw specifieke reparatiebehoeften. U kunt filteren op locatie, beoordelingen en expertise, en vervolgens direct een afspraak boeken."
      }
    }
  ] : [
    {
      "@type": "Question",
      name: "How does AI repair diagnosis work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply describe your device issue or upload a photo. Our AI analyzes the problem and provides instant diagnosis with repair recommendations, estimated costs, and connects you with verified local repair shops."
      }
    },
    {
      "@type": "Question",
      name: "Is the repair diagnosis free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, our AI-powered repair diagnosis is completely free. You can get instant analysis for your phone, laptop, or tablet without any cost."
      }
    },
    {
      "@type": "Question",
      name: "What devices can be diagnosed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We support diagnosis for iPhones, Android phones, MacBooks, Windows laptops, tablets, and other electronic devices. Our AI can help with screen repairs, battery replacements, software issues, and more."
      }
    },
    {
      "@type": "Question",
      name: "How do I find a repair shop near me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After getting your diagnosis, we'll show you verified repair shops in your area that specialize in your specific repair needs. You can filter by location, ratings, and expertise, then book an appointment directly."
      }
    }
  ]
  
  return (
    <html lang={locale} suppressHydrationWarning>
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
              logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/logo.png`,
                width: 1200,
                height: 630
              },
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                availableLanguage: ["English", "Dutch", "Nederlands"]
              },
              areaServed: {
                "@type": "Country",
                name: "Worldwide"
              },
              knowsAbout: [
                "Phone Repair",
                "Laptop Repair",
                "Tablet Repair",
                "Device Diagnosis",
                "Screen Replacement",
                "Battery Replacement"
              ]
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
              alternateName: "FixWise Repair Diagnosis",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              serviceType: "Device Repair Diagnosis",
              provider: {
                "@type": "Organization",
                name: "FixWise"
              },
              areaServed: {
                "@type": "Country",
                name: "Worldwide"
              },
              description: serviceDescription,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqData
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          <Navbar />
          {children}
        </I18nProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
