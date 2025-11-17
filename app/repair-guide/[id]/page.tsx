import { RepairGuideViewer } from "@/components/repair-guide-viewer"
import { notFound } from 'next/navigation'

export default async function RepairGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id || id === "undefined") {
    notFound()
  }

  // Fetch the guide from iFixit API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/api/ifixit/guides/${id}`,
    {
      cache: "no-store",
    },
  )

  if (!response.ok) {
    notFound()
  }

  const guide = await response.json()

  return (
    <div className="container mx-auto px-4 py-8">
      <RepairGuideViewer guide={guide} />
    </div>
  )
}
