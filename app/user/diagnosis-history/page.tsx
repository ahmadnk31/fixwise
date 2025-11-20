import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DiagnosisHistory } from "@/components/diagnosis-history"
import { DiagnosisHistoryHeader } from "@/components/diagnosis-history-header"

export const metadata = {
  title: "My Diagnosis History - FixWise",
  description: "View your device diagnosis history",
}

export default async function DiagnosisHistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's diagnoses
  const { data: diagnoses, error: diagnosesError } = await supabase
    .from("diagnoses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (diagnosesError) {
    console.error("Error fetching diagnoses:", diagnosesError)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DiagnosisHistoryHeader />
        <DiagnosisHistory diagnoses={diagnoses || []} />
      </div>
    </div>
  )
}

