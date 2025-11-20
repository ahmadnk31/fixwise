import type { Metadata } from "next"
import { Locale, translations } from "./translations"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fixwise.be'

export function getMetadataForLocale(locale: Locale = 'en'): Metadata {
  const t = translations[locale]
  
  return {
    title: {
      default: locale === 'nl' 
        ? "FixWise - Gratis AI Reparatiediagnose voor Telefoon & Laptop"
        : "FixWise - Free AI Repair Diagnosis for Phone & Laptop",
      template: locale === 'nl' ? "%s | FixWise" : "%s | FixWise"
    },
    description: locale === 'nl'
      ? "Gratis AI-reparatiediagnose voor iPhone, Android, MacBook en Windows-apparaten. Beschrijf uw probleem en krijg directe expertaanbevelingen. Verbind met geverifieerde lokale reparatiezaken bij u in de buurt."
      : "Free AI repair diagnosis for iPhone, Android, MacBook, and Windows devices. Describe your issue and get instant expert recommendations. Connect with verified local repair shops near you.",
    keywords: locale === 'nl'
      ? [
          "AI reparatiediagnose",
          "telefoon diagnose",
          "laptop reparatie",
          "gratis apparaatcontrole",
          "reparatiezaak zoeker",
          "apparaat reparatie",
          "scherm reparatie",
          "batterij vervanging",
          "reparatiezaken",
          "telefoon reparatie",
          "laptop reparatie",
        ]
      : [
          "AI repair diagnosis",
          "phone diagnosis",
          "laptop repair",
          "free device check",
          "repair shop finder",
          "device repair",
          "screen repair",
          "battery replacement",
        ],
    openGraph: {
      title: locale === 'nl'
        ? "FixWise - Gratis AI Reparatiediagnose voor Telefoon & Laptop"
        : "FixWise - Free AI Repair Diagnosis for Phone & Laptop",
      description: locale === 'nl'
        ? "Krijg directe AI-diagnose voor uw defecte apparaat en vind vertrouwde reparatiezaken in de buurt. Gratis analyse voor alle apparaten."
        : "Get instant AI diagnosis for your broken device and find trusted repair shops nearby. Free analysis for all devices.",
      type: "website",
      locale: locale === 'nl' ? "nl_NL" : "en_US",
      alternateLocale: locale === 'nl' ? ["en_US"] : ["nl_NL"],
      url: baseUrl,
      siteName: "FixWise",
      images: [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: locale === 'nl' 
            ? "FixWise - AI Reparatiediagnose Platform"
            : "FixWise - AI Repair Diagnosis Platform",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: locale === 'nl'
        ? "FixWise - Gratis AI Reparatiediagnose"
        : "FixWise - Free AI Repair Diagnosis",
      description: locale === 'nl'
        ? "Krijg directe AI-diagnose voor uw defecte apparaat en vind vertrouwde reparatiezaken in de buurt."
        : "Get instant AI diagnosis for your broken device and find trusted repair shops nearby.",
      images: [`${baseUrl}/logo.png`],
      creator: "@fixwise",
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        'en': baseUrl,
        'nl': baseUrl,
        'x-default': baseUrl,
      },
    },
  }
}

export function getShopsPageMetadata(locale: Locale = 'en'): Metadata {
  return {
    title: locale === 'nl'
      ? "Vind Lokale Reparatiezaken Bij U | FixWise"
      : "Find Local Repair Shops Near You | FixWise",
    description: locale === 'nl'
      ? "Blader door vertrouwde reparatiezaken voor telefoon-, laptop- en tabletreparaties. Filter op expertise, locatie en beoordelingen. Geverifieerde reparatieprofessionals in uw omgeving. Vind de beste reparatiezaak bij u in de buurt."
      : "Browse trusted repair shops for phone, laptop, and tablet repairs. Filter by expertise, location, and ratings. Verified repair professionals in your area. Find the best repair shop near you.",
    keywords: locale === 'nl'
      ? [
          "reparatiezaken bij mij",
          "telefoon reparatiezaken",
          "laptop reparatie bij mij",
          "lokale reparatiediensten",
          "geverifieerde reparatiezaken",
          "apparaat reparatie",
          "reparatiezaken",
          "telefoon reparatie",
          "laptop reparatie",
        ]
      : [
          "repair shops near me",
          "phone repair shops",
          "laptop repair near me",
          "local repair services",
          "verified repair shops",
          "device repair",
        ],
    openGraph: {
      title: locale === 'nl'
        ? "Vind Lokale Reparatiezaken - FixWise"
        : "Find Local Repair Shops - FixWise",
      description: locale === 'nl'
        ? "Blader door vertrouwde reparatiezaken voor telefoon-, laptop- en tabletreparaties bij u in de buurt. Geverifieerde professionals met beoordelingen en recensies."
        : "Browse trusted repair shops for phone, laptop, and tablet repairs near you. Verified professionals with ratings and reviews.",
      type: "website",
      locale: locale === 'nl' ? "nl_NL" : "en_US",
      alternateLocale: locale === 'nl' ? ["en_US"] : ["nl_NL"],
      url: `${baseUrl}/shops`,
      siteName: "FixWise",
      images: [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: locale === 'nl' 
            ? "FixWise - Vind Reparatiezaken"
            : "FixWise - Find Repair Shops",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: locale === 'nl'
        ? "Vind Lokale Reparatiezaken - FixWise"
        : "Find Local Repair Shops - FixWise",
      description: locale === 'nl'
        ? "Blader door vertrouwde reparatiezaken voor telefoon-, laptop- en tabletreparaties bij u in de buurt."
        : "Browse trusted repair shops for phone, laptop, and tablet repairs near you.",
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
}

export function getShopDetailMetadata(
  shop: {
    name: string
    address: string
    expertise?: string[] | null
    rating?: number | null
    description?: string | null
    profile_image?: string | null
    photo_url?: string | null
  },
  shopId: string,
  locale: Locale = 'en'
): Metadata {
  const expertiseList = shop.expertise?.slice(0, 5).join(", ") || (locale === 'nl' ? "apparaat reparatie" : "device repair")
  
  const description = locale === 'nl'
    ? `${shop.name} - Professionele reparatiediensten in ${shop.address}. Gespecialiseerd in ${expertiseList}. ${shop.rating ? `Beoordeling: ${shop.rating}/5.` : ''} Boek vandaag nog uw reparatieafspraak.`
    : `${shop.name} - Professional repair services in ${shop.address}. Specializing in ${expertiseList}. ${shop.rating ? `Rating: ${shop.rating}/5.` : ''} Book your repair appointment today.`

  const keywords = locale === 'nl'
    ? [
        ...(shop.expertise || []),
        "reparatiezaak",
        "telefoon reparatie",
        "laptop reparatie",
        "apparaat reparatie",
        shop.name,
        shop.address,
      ]
    : [
        ...(shop.expertise || []),
        "repair shop",
        "phone repair",
        "laptop repair",
        "device repair",
        shop.name,
        shop.address,
      ]

  return {
    title: locale === 'nl'
      ? `${shop.name} - Reparatiediensten & Recensies | FixWise`
      : `${shop.name} - Repair Services & Reviews | FixWise`,
    description,
    keywords,
    openGraph: {
      title: locale === 'nl'
        ? `${shop.name} - Professionele Reparatiediensten`
        : `${shop.name} - Professional Repair Services`,
      description,
      type: "website",
      locale: locale === 'nl' ? "nl_NL" : "en_US",
      alternateLocale: locale === 'nl' ? ["en_US"] : ["nl_NL"],
      url: `${baseUrl}/shops/${shopId}`,
      siteName: "FixWise",
      images: (shop.profile_image || shop.photo_url) ? [
        {
          url: shop.profile_image || shop.photo_url || '',
          width: 1200,
          height: 630,
          alt: `${shop.name} - ${locale === 'nl' ? 'Reparatiezaak' : 'Repair Shop'}`,
        }
      ] : [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: `${shop.name} - ${locale === 'nl' ? 'Reparatiezaak' : 'Repair Shop'}`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: locale === 'nl'
        ? `${shop.name} - Professionele Reparatiediensten`
        : `${shop.name} - Professional Repair Services`,
      description,
      images: (shop.profile_image || shop.photo_url) 
        ? [shop.profile_image || shop.photo_url || ''] 
        : [`${baseUrl}/logo.png`],
    },
    alternates: {
      canonical: `${baseUrl}/shops/${shopId}`,
      languages: {
        'en': `${baseUrl}/shops/${shopId}`,
        'nl': `${baseUrl}/shops/${shopId}`,
      },
    },
  }
}

// Helper to detect locale from headers (server-side)
export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language') || ''
  if (acceptLanguage.includes('nl')) {
    return 'nl'
  }
  return 'en'
}

