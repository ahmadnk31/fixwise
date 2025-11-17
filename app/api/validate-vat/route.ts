import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { vatNumber, countryCode } = await request.json()

    if (!vatNumber || !countryCode) {
      return NextResponse.json({ error: "VAT number and country code are required" }, { status: 400 })
    }

    // Clean VAT number (remove spaces, dashes, etc.)
    const cleanVatNumber = vatNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase()
    const cleanCountryCode = countryCode.toUpperCase()

    console.log("[v0] Validating VAT:", cleanCountryCode, cleanVatNumber)

    // Call EU VIES VAT validation service
    const viesUrl = "https://ec.europa.eu/taxation_customs/vies/rest-api/ms/" + 
                    `${cleanCountryCode}/vat/${cleanVatNumber}`

    const response = await fetch(viesUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] VIES API error:", response.status, response.statusText)
      return NextResponse.json(
        { 
          valid: false, 
          error: "Unable to validate VAT number. Please check the number and try again." 
        },
        { status: 200 }
      )
    }

    const data = await response.json()
    console.log("[v0] VIES response:", data)

    // VIES API response structure
    const isValid = data.isValid === true

    return NextResponse.json({
      valid: isValid,
      countryCode: data.countryCode || cleanCountryCode,
      vatNumber: data.vatNumber || cleanVatNumber,
      name: data.name || null,
      address: data.address || null,
      requestDate: data.requestDate || new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] VAT validation error:", error)
    return NextResponse.json(
      { 
        valid: false, 
        error: "VAT validation service temporarily unavailable. You can still save and validate later." 
      },
      { status: 200 }
    )
  }
}
