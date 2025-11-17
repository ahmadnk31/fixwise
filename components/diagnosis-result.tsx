"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Wrench, DollarSign, BookOpen, ExternalLink } from 'lucide-react'
import type { DiagnosisResult as DiagnosisResultType } from "@/lib/types"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"

interface DiagnosisResultProps {
  result: DiagnosisResultType
  diagnosisId: string
  onReset: () => void
}

export function DiagnosisResult({ result, diagnosisId, onReset }: DiagnosisResultProps) {
  const { t } = useI18n()
  const [guides, setGuides] = useState<any[]>([])
  const [loadingGuides, setLoadingGuides] = useState(false)

  useEffect(() => {
    const fetchGuides = async () => {
      if (!result.device_type) return

      setLoadingGuides(true)
      try {
        // Try 1: Device + Component (e.g., "iPhone 14 Pro Max camera")
        let searchQuery = result.repair_component 
          ? `${result.device_type} ${result.repair_component}`.trim()
          : `${result.device_type} ${result.probable_issue}`.trim()
        
        console.log("[v0] Search attempt 1 - Query:", searchQuery)
        let response = await fetch(`/api/ifixit/search?query=${encodeURIComponent(searchQuery)}`)
        let data = await response.json()
        console.log("[v0] Search attempt 1 - Results:", data.total)
        
        // Try 2: Add "replacement" keyword if no results
        if ((!data.guides || data.guides.length === 0) && result.repair_component) {
          searchQuery = `${result.device_type} ${result.repair_component} replacement`.trim()
          console.log("[v0] Search attempt 2 - Query:", searchQuery)
          response = await fetch(`/api/ifixit/search?query=${encodeURIComponent(searchQuery)}`)
          data = await response.json()
          console.log("[v0] Search attempt 2 - Results:", data.total)
        }
        
        // Try 3: Just device type as last fallback
        if (!data.guides || data.guides.length === 0) {
          searchQuery = result.device_type
          console.log("[v0] Search attempt 3 (fallback) - Query:", searchQuery)
          response = await fetch(`/api/ifixit/search?query=${encodeURIComponent(searchQuery)}`)
          data = await response.json()
          console.log("[v0] Search attempt 3 - Results:", data.total)
        }
        
        setGuides(data.guides?.slice(0, 3) || [])
      } catch (error) {
        console.error("[v0] Failed to fetch repair guides:", error)
      } finally {
        setLoadingGuides(false)
      }
    }

    fetchGuides()
  }, [result.device_type, result.repair_component, result.probable_issue])

  const getDifficultyColor = (difficulty: string) => {
    const level = Number.parseInt(difficulty)
    if (level <= 2) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (level <= 3) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    return "bg-red-500/10 text-red-500 border-red-500/20"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {t.diagnosisResult.complete}
              </CardTitle>
              <CardDescription className="mt-2">{t.diagnosisResult.description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onReset}>
              {t.diagnosisResult.newDiagnosis}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(result.device_brand || result.device_type) && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t.diagnosisResult.device}</h3>
              <div className="flex flex-wrap gap-2">
                {result.device_brand && (
                  <Badge variant="secondary">{result.device_brand}</Badge>
                )}
                {result.device_type && (
                  <Badge variant="outline">{result.device_type}</Badge>
                )}
              </div>
            </div>
          )}

          {result.repair_component && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t.diagnosisResult.component}</h3>
              <Badge variant="secondary">{result.repair_component}</Badge>
            </div>
          )}

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              {t.diagnosisResult.probableIssue}
            </h3>
            <p className="text-base">{result.probable_issue}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t.diagnosisResult.likelyCause}</h3>
            <p className="text-sm text-muted-foreground">{result.likely_cause}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t.diagnosisResult.repairDifficulty}</h3>
              <Badge variant="outline" className={getDifficultyColor(result.repair_difficulty)}>
                {t.diagnosisResult.level} {result.repair_difficulty}/5
              </Badge>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                {t.diagnosisResult.estimatedCost}
              </h3>
              <p className="text-base font-semibold">{result.estimated_cost}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4" />
              {t.diagnosisResult.recommendedAction}
            </h3>
            <p className="text-sm text-muted-foreground">{result.recommended_action}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t.diagnosisResult.repairGuides}
          </CardTitle>
          <CardDescription>{t.diagnosisResult.guidesDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGuides ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t.diagnosisResult.loadingGuides}</div>
          ) : guides.length > 0 ? (
            <div className="space-y-3">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  href={guide.url || `/repair-guide/${guide.id}`}
                  target={guide.url ? "_blank" : undefined}
                  rel={guide.url ? "noopener noreferrer" : undefined}
                  className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start gap-4">
                    {guide.image_url && (
                      <img
                        src={guide.image_url || "/placeholder.svg"}
                        alt={guide.title}
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{guide.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{guide.summary}</p>
                      {guide.difficulty && (
                        <Badge variant="outline" className="mt-2">
                          {guide.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.diagnosisResult.searchGuides}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={`https://www.ifixit.com/Search?query=${encodeURIComponent(
                    result.repair_component 
                      ? `${result.device_type} ${result.repair_component}` 
                      : `${result.device_type} ${result.probable_issue}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t.diagnosisResult.searchiFixit}
                  </Button>
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    result.repair_component 
                      ? `${result.device_type} ${result.repair_component} repair` 
                      : `${result.device_type} ${result.probable_issue} repair`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t.diagnosisResult.findVideos}
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/shops?diagnosis=${diagnosisId}`} className="flex-1">
          <Button className="w-full" size="lg">
            {t.diagnosisResult.findShops}
          </Button>
        </Link>
        <Button variant="outline" size="lg" onClick={onReset}>
          {t.diagnosisResult.startOver}
        </Button>
      </div>
    </div>
  )
}
