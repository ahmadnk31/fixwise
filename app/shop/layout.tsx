import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Shop Dashboard - FixWise",
    template: "%s | FixWise Shop Dashboard"
  },
  description: "Manage your repair shop, view bookings, products, and customer reviews on FixWise.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
