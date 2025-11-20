"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, DollarSign, Wrench, Calendar, ExternalLink, Search } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import type { Diagnosis } from "@/lib/types"
import { useI18n } from "@/lib/i18n/context"

interface DiagnosisHistoryProps {
  diagnoses: Diagnosis[]
}

export function DiagnosisHistory({ diagnoses }: DiagnosisHistoryProps) {
  const { t } = useI18n()
  
  if (diagnoses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t.history.noHistory}</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            {t.history.noHistoryDescription}
          </p>
          <Link href="/">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              {t.history.startNew}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    const level = Number.parseInt(difficulty)
    if (level <= 2) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (level <= 3) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    return "bg-red-500/10 text-red-500 border-red-500/20"
  }

  return (
    <div className="space-y-4">
      {diagnoses.map((diagnosis) => {
        const result = diagnosis.ai_response as any

        return (
          <Card key={diagnosis.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    {result.device_type || result.device_brand || "Device Diagnosis"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(diagnosis.created_at), "PPP 'at' p")}
                  </CardDescription>
                </div>
                {diagnosis.photo_url && (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden border">
                    <Image
                      src={diagnosis.photo_url}
                      alt="Diagnosis photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Input */}
              <div>
                <h4 className="mb-1 text-sm font-semibold text-muted-foreground">{t.diagnosis.issue}</h4>
                <p className="text-sm">{diagnosis.user_input}</p>
              </div>

              {/* Device Info */}
              {(result.device_brand || result.device_type || result.repair_component) && (
                <div className="flex flex-wrap gap-2">
                  {result.device_brand && (
                    <Badge variant="secondary">{result.device_brand}</Badge>
                  )}
                  {result.device_type && (
                    <Badge variant="outline">{result.device_type}</Badge>
                  )}
                  {result.repair_component && (
                    <Badge variant="secondary">{result.repair_component}</Badge>
                  )}
                </div>
              )}

              {/* Probable Issue */}
              {result.probable_issue && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold">{t.diagnosisResult.probableIssue}</h4>
                  <p className="text-sm">{result.probable_issue}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                {result.repair_difficulty && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-muted-foreground">{t.history.difficulty}</h4>
                    <Badge variant="outline" className={getDifficultyColor(result.repair_difficulty)}>
                      <Wrench className="mr-1 h-3 w-3" />
                      {t.diagnosisResult.level} {result.repair_difficulty}/5
                    </Badge>
                  </div>
                )}

                {result.estimated_cost && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-muted-foreground">{t.history.estimatedCost}</h4>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {result.estimated_cost}
                    </p>
                  </div>
                )}

                {result.recommended_action && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-muted-foreground">{t.diagnosisResult.recommendedAction}</h4>
                    <p className="text-sm">{result.recommended_action}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t sm:flex-row">
                <Link href={`/shops?diagnosis=${diagnosis.id}`} className="flex-1">
                  <Button variant="default" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t.diagnosis.findShops}
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    {t.diagnosis.startNew}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

