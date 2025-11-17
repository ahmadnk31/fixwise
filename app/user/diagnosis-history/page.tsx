import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DiagnosisHistory } from "@/components/diagnosis-history"
import { Navbar } from "@/components/navbar"

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
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">My Diagnosis History</h1>
          <p className="text-muted-foreground">
            View all your previous device diagnoses
          </p>
        </div>
        <DiagnosisHistory diagnoses={diagnoses || []} />
      </div>
    </div>
  )
}

