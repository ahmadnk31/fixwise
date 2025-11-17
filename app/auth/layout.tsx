import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Authentication - FixWise",
    template: "%s | FixWise"
  },
  description: "Sign in or create an account to access FixWise. Manage your repair shop, view bookings, and connect with customers.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
