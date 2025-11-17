import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] iFixit search query:", query)

    const searchUrl = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(query)}?doctypes=guide`
    console.log("[v0] iFixit API URL:", searchUrl)

    const response = await fetch(searchUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] iFixit API status:", response.status)

    if (!response.ok) {
      console.error("[v0] iFixit API error:", response.status, response.statusText)
      throw new Error(`iFixit API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] iFixit API response:", JSON.stringify(data).slice(0, 500))

    const normalizedGuides = (data.results || []).map((guide: any) => ({
      id: guide.guideid || guide.wikiid || guide.id,
      title: guide.title || guide.display_title,
      summary: guide.summary || guide.text,
      image_url: guide.image?.standard || guide.image?.thumbnail,
      difficulty: guide.difficulty,
      url: guide.url,
      dataType: guide.dataType,
    }))

    return NextResponse.json({
      guides: normalizedGuides,
      total: data.totalResults || 0,
    })
  } catch (error) {
    console.error("[v0] iFixit search error:", error)
    return NextResponse.json({ error: "Failed to search repair guides", guides: [], total: 0 }, { status: 500 })
  }
}
