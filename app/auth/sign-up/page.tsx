"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { CheckCircle2, Loader2 } from 'lucide-react'
import Image from "next/image"

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
]

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [isShopOwner, setIsShopOwner] = useState(false)
  
  const [country, setCountry] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [vatValidated, setVatValidated] = useState(false)
  const [isValidatingVat, setIsValidatingVat] = useState(false)
  const [vatValidationMessage, setVatValidationMessage] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isEUCountry = EU_COUNTRIES.some((c) => c.code === country)

  const handleValidateVat = async () => {
    if (!vatNumber || !country) {
      setVatValidationMessage("Please enter VAT number and select country")
      return
    }

    setIsValidatingVat(true)
    setVatValidationMessage("")

    try {
      const response = await fetch("/api/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatNumber, countryCode: country }),
      })

      const data = await response.json()

      if (data.valid) {
        setVatValidated(true)
        setVatValidationMessage("VAT number validated successfully!")
        if (data.companyName && !businessName) {
          setBusinessName(data.companyName)
        }
      } else {
        setVatValidated(false)
        setVatValidationMessage(data.message || "Invalid VAT number")
      }
    } catch (error) {
      setVatValidationMessage("Error validating VAT number")
    } finally {
      setIsValidatingVat(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (isShopOwner && isEUCountry) {
      if (!businessName || !vatNumber || !registrationNumber || !businessAddress) {
        setError("Please fill in all business details for EU countries")
        setIsLoading(false)
        return
      }
      if (!vatValidated) {
        setError("Please validate your VAT number before signing up")
        setIsLoading(false)
        return
      }
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/shop/dashboard`,
          data: {
            name,
            role: isShopOwner ? "shop" : "user",
          },
        },
      })

      if (authError) throw authError

      if (isShopOwner && authData.user) {
        const { error: shopError } = await supabase.from("repair_shops").insert({
          owner_id: authData.user.id,
          name: name,
          email: email,
          country: country || null,
          business_name: businessName || null,
          vat_number: vatNumber || null,
          registration_number: registrationNumber || null,
          business_address: businessAddress || null,
          vat_validated: vatValidated,
        })

        if (shopError) {
          console.error("Error creating shop:", shopError)
        }
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image 
          src="/logo.png" 
          alt="FixWise Logo" 
          width={200} 
          height={68}
          className="h-14 w-auto"
        />
      </Link>

      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>Create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shop-owner"
                    checked={isShopOwner}
                    onCheckedChange={(checked) => setIsShopOwner(checked === true)}
                  />
                  <Label htmlFor="shop-owner" className="text-sm font-normal">
                    I am a repair shop owner
                  </Label>
                </div>

                {isShopOwner && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">Business Details</h3>

                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {EU_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (Non-EU)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isEUCountry && (
                      <>
                        <Alert>
                          <AlertDescription>
                            EU businesses must provide valid VAT and registration details
                          </AlertDescription>
                        </Alert>

                        <div className="grid gap-2">
                          <Label htmlFor="business-name">Legal Business Name *</Label>
                          <Input
                            id="business-name"
                            type="text"
                            placeholder="Acme Repair Ltd."
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="vat-number">VAT Number *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="vat-number"
                              type="text"
                              placeholder="DE123456789"
                              required
                              value={vatNumber}
                              onChange={(e) => {
                                setVatNumber(e.target.value)
                                setVatValidated(false)
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleValidateVat}
                              disabled={isValidatingVat || !vatNumber || !country}
                            >
                              {isValidatingVat ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : vatValidated ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                "Validate"
                              )}
                            </Button>
                          </div>
                          {vatValidationMessage && (
                            <p
                              className={`text-sm ${
                                vatValidated ? "text-green-600" : "text-destructive"
                              }`}
                            >
                              {vatValidationMessage}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="registration-number">Company Registration Number *</Label>
                          <Input
                            id="registration-number"
                            type="text"
                            placeholder="HRB 123456"
                            required
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="business-address">Registered Business Address *</Label>
                          <Input
                            id="business-address"
                            type="text"
                            placeholder="123 Main St, Berlin, Germany"
                            required
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
