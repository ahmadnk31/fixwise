"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { DiagnosisResult } from "./diagnosis-result"
import type { DiagnosisResult as DiagnosisResultType } from "@/lib/types"
import { useI18n } from "@/lib/i18n/context"

export function DiagnosisForm() {
  const { t } = useI18n()
  const [issue, setIssue] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DiagnosisResultType | null>(null)
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedDiagnosis = localStorage.getItem("fixwise_diagnosis")
    if (savedDiagnosis) {
      try {
        const parsed = JSON.parse(savedDiagnosis)
        setResult(parsed.result)
        setDiagnosisId(parsed.diagnosisId)
        setIssue(parsed.issue || "")
      } catch (error) {
        console.error("Failed to restore diagnosis:", error)
        localStorage.removeItem("fixwise_diagnosis")
      }
    }
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("issue", issue)
      if (image) {
        formData.append("image", image)
      }

      const response = await fetch("/api/diagnose", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to get diagnosis")
      }

      const data = await response.json()
      setResult(data.diagnosis)
      setDiagnosisId(data.diagnosisId)
      
      localStorage.setItem("fixwise_diagnosis", JSON.stringify({
        result: data.diagnosis,
        diagnosisId: data.diagnosisId,
        issue: issue
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  if (result && diagnosisId) {
    return (
      <DiagnosisResult
        result={result}
        diagnosisId={diagnosisId}
        onReset={() => {
          setResult(null)
          setDiagnosisId(null)
          setIssue("")
          setImage(null)
          setImagePreview(null)
          localStorage.removeItem("fixwise_diagnosis")
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            id="issue"
            placeholder={t.diagnosis.describeIssue}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            required
            rows={3}
            className="resize-none rounded-full border-2 px-6 py-4 text-base shadow-lg focus-visible:ring-2"
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button type="submit" size="lg" disabled={isLoading || !issue.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.diagnosis.analyzing}
              </>
            ) : (
              t.diagnosis.getDiagnosis
            )}
          </Button>
        </div>

        {!imagePreview ? (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                {isDragActive ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-primary" />
                )}
              </div>
              {isDragActive ? (
                <p className="text-sm font-medium text-primary">{t.diagnosis.uploadPhoto}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    <span className="text-primary underline">{t.diagnosis.uploadPhoto}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex justify-center">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-48 w-auto max-w-full rounded-lg object-cover shadow-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </form>
    </div>
  )
}
