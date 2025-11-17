import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Guide ID is required" }, { status: 400 })
    }

    // Fetch the specific guide from iFixit
    const response = await fetch(`https://www.ifixit.com/api/2.0/guides/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`iFixit API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("iFixit guide fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch repair guide" }, { status: 500 })
  }
}
