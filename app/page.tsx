import type { Metadata } from "next"
import Image from "next/image"
import { HomePageClient, HomePageLinks, HomePageFooter } from "@/components/home-page-client"
import { DiagnosisForm } from "@/components/diagnosis-form"
import { createClient } from "@/lib/supabase/server"
import { getMetadataForLocale, getLocaleFromHeaders } from "@/lib/i18n/metadata"
import { headers } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = getLocaleFromHeaders(headersList)
  return getMetadataForLocale(locale)
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let showRegisterLink = true

  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
    showRegisterLink = profile?.role === "user"
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Centered Content - Google Style */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo and Tagline */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="FixWise - AI-Powered Repair Diagnosis Platform" 
                width={400} 
                height={120}
                className="h-20 w-auto md:h-28"
                priority
              />
            </div>
            <h1 className="sr-only">FixWise - Free AI Repair Diagnosis for Phone & Laptop</h1>
            <HomePageClient />
          </div>

          {/* Simple Diagnosis Form */}
          <DiagnosisForm />

          {/* Minimal Links */}
          <HomePageLinks showRegisterLink={showRegisterLink} />
        </div>
      </main>

      {/* Minimal Footer */}
      <HomePageFooter />
    </div>
  )
}
