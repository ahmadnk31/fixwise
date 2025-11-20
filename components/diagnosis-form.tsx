"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Image as ImageIcon, X, Search, Upload } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleImageFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }
    setImage(file)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      handleImageFile(file)
    }
  }, [handleImageFile])

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    noClick: true, // Don't open file dialog on click
    noKeyboard: true, // Don't open file dialog on keyboard
  })

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue.trim()) return
    
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
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
    <div className="w-full" {...getRootProps()}>
      <form onSubmit={handleSubmit} className="w-full">
        {/* Google-style search input */}
        <div className="relative mx-auto max-w-2xl">
          <div
            className={`relative flex items-center rounded-full border-2 bg-background shadow-lg transition-all ${
              isDragActive
                ? "border-primary bg-primary/5 shadow-xl ring-2 ring-primary/20"
                : isFocused
                ? "border-primary shadow-xl"
                : "border-border hover:shadow-xl"
            }`}
          >
            {/* Search icon on the left */}
            <div className="pl-5 pr-3">
              {isDragActive ? (
                <Upload className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Main input */}
            <Input
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={isDragActive ? t.diagnosis.uploadPhoto : t.diagnosis.describeIssue}
              className="flex-1 border-0 bg-transparent py-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />

            {/* Image upload button */}
            <div className="flex items-center gap-2 pr-2">
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={t.diagnosis.uploadPhoto}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Submit button (shows when focused or has text) */}
              {(isFocused || issue.trim()) && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !issue.trim()}
                  className="rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Image preview below input (if exists) */}
          {imagePreview && (
            <div className="mt-3 flex justify-center">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-auto rounded-lg object-cover shadow-md"
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-2 text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </form>
    </div>
  )
}
