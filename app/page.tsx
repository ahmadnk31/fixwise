import { DiagnosisForm } from "@/components/diagnosis-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { HomePageClient, HomePageLinks, HomePageFooter } from "@/components/home-page-client"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fixwise.vercel.app'

export const metadata: Metadata = {
  title: "FixWise - Free AI Repair Diagnosis for Phone & Laptop",
  description: "Describe your device issue and get instant AI-powered repair diagnosis. Free analysis for iPhone, Android, MacBook, and Windows laptops. Connect with verified local repair shops. Get expert repair recommendations instantly.",
  keywords: [
    "AI repair diagnosis",
    "phone diagnosis",
    "laptop repair",
    "free device check",
    "repair shop finder",
    "device repair",
    "screen repair",
    "battery replacement",
    "AI reparatiediagnose",
    "telefoon diagnose",
    "laptop reparatie",
  ],
  openGraph: {
    title: "FixWise - Free AI Repair Diagnosis for Phone & Laptop",
    description: "Get instant AI diagnosis for your broken device and find trusted repair shops nearby. Free analysis for all devices.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["nl_NL"],
    url: baseUrl,
    siteName: "FixWise",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "FixWise - AI Repair Diagnosis Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FixWise - Free AI Repair Diagnosis",
    description: "Get instant AI diagnosis for your broken device and find trusted repair shops nearby.",
    images: [`${baseUrl}/logo.png`],
    creator: "@fixwise",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'en': baseUrl,
      'nl': baseUrl,
    },
  },
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Minimal Header */}
      <Navbar variant="minimal" />

      {/* Centered Content - Google Style */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo and Tagline */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="FixWise - AI-Powered Repair Diagnosis" 
                width={400} 
                height={120}
                className="h-20 w-auto md:h-28"
                priority
              />
            </div>
            <HomePageClient />
          </div>

          {/* Simple Diagnosis Form */}
          <DiagnosisForm />

          {/* Minimal Links */}
          <HomePageLinks />
        </div>
      </main>

      {/* Minimal Footer */}
      <HomePageFooter />
    </div>
  )
}
