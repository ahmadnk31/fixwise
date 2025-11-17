import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai";
export const maxDuration = 30
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const issue = formData.get("issue") as string
    const image = formData.get("image") as File | null

    if (!issue) {
      return NextResponse.json({ error: "Issue description is required" }, { status: 400 })
    }

    let photoUrl: string | null = null
    const supabase = await createClient()

    // Get authenticated user (if any)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (image) {
      const fileExt = image.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `diagnoses/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("diagnosis-images")
        .upload(filePath, image, {
          contentType: image.type,
          cacheControl: "3600",
        })

      if (uploadError) {
        console.error("Image upload error:", uploadError)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("diagnosis-images").getPublicUrl(filePath)
        photoUrl = publicUrl
      }
    }

    const prompt = `You are an expert electronics repair technician.
The user will describe a device issue (phone, laptop, tablet, etc.).
Your goal:
1. Identify the device brand (e.g., "iPhone", "Samsung", "OnePlus", "MacBook", "Dell", "HP")
2. Identify the device type and model if possible (e.g., "iPhone 12", "OnePlus 12", "MacBook Pro 2020", "Samsung Galaxy S21")
3. Identify the specific component or part that needs repair (e.g., "screen", "display", "camera", "battery", "charging port", "speaker", "microphone")
4. Identify the most likely cause of the problem.
5. Estimate the repair difficulty (1–5, where 1 is easiest and 5 is most difficult).
6. Suggest whether the user can fix it or needs a professional.
7. Provide a rough cost range ($).
8. Respond in this JSON format:
{
  "device_brand": "device brand name (e.g., iPhone, Samsung, OnePlus, MacBook, Dell)",
  "device_type": "exact device model (e.g., iPhone 12, OnePlus 12, MacBook Pro 2020)",
  "repair_component": "specific part that needs repair (e.g., screen, display, camera, battery)",
  "repair_keywords": ["alternative", "keywords", "for", "matching", "e.g.", "screen", "display", "lcd", "oled"],
  "probable_issue": "description of the issue",
  "likely_cause": "what caused the problem",
  "repair_difficulty": "1-5",
  "recommended_action": "DIY or Professional",
  "estimated_cost": "$X-$Y"
}

Important: 
- Extract the brand name separately (OnePlus, iPhone, Samsung, etc.)
- Include alternative keywords for the repair component (e.g., for "screen" also include "display", "LCD", "OLED")
- Use common repair terminology that shops might use

User's issue: ${issue}`

    // Call OpenAI for diagnosis
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 500,
    })

    // Parse the AI response
    let diagnosis
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return NextResponse.json({ error: "Failed to parse diagnosis" }, { status: 500 })
    }

    // Save diagnosis to database
    const { data: diagnosisData, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        user_id: user?.id || null,
        user_input: issue,
        ai_response: diagnosis,
        estimated_cost: diagnosis.estimated_cost,
        photo_url: photoUrl,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save diagnosis" }, { status: 500 })
    }

    return NextResponse.json({
      diagnosis,
      diagnosisId: diagnosisData.id,
    })
  } catch (error) {
    console.error("Diagnosis error:", error)
    return NextResponse.json({ error: "Failed to process diagnosis" }, { status: 500 })
  }
}
