"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Wrench, Package, ArrowLeft, ExternalLink, CheckCircle2, Circle, Youtube } from 'lucide-react'
import Link from "next/link"
import type { IFixitGuide } from "@/lib/types"
import { useState } from "react"

interface RepairGuideViewerProps {
  guide: IFixitGuide
}

export function RepairGuideViewer({ guide }: RepairGuideViewerProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const toggleStepCompletion = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(guide.title + " repair guide")}`

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl">{guide.title}</CardTitle>
              <CardDescription className="mt-2 text-base">{guide.summary}</CardDescription>
            </div>
            {guide.image && (
              <img
                src={guide.image.standard || "/placeholder.svg"}
                alt={guide.title}
                className="h-32 w-32 rounded-lg object-cover shadow-md"
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {guide.difficulty && (
              <Badge variant="outline" className="px-3 py-1">
                <Wrench className="mr-1 h-3 w-3" />
                {guide.difficulty}
              </Badge>
            )}
            {guide.time_required && (
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="mr-1 h-3 w-3" />
                {guide.time_required}
              </Badge>
            )}
            <a
              href={`https://www.ifixit.com/Guide/${guide.subject}/${guide.guideid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="cursor-pointer px-3 py-1 hover:bg-accent">
                <ExternalLink className="mr-1 h-3 w-3" />
                View on iFixit
              </Badge>
            </a>
            <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="cursor-pointer bg-red-50 px-3 py-1 text-red-600 hover:bg-red-100">
                <Youtube className="mr-1 h-3 w-3" />
                Find Video Tutorial
              </Badge>
            </a>
          </div>
        </CardHeader>

        {(guide.tools?.length > 0 || guide.parts?.length > 0) && (
          <CardContent className="border-t">
            <div className="grid gap-6 md:grid-cols-2">
              {guide.tools?.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Wrench className="h-5 w-5" />
                    Tools Required
                  </h3>
                  <ul className="space-y-2">
                    {guide.tools.map((tool, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">{tool.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {guide.parts?.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Package className="h-5 w-5" />
                    Parts Needed
                  </h3>
                  <ul className="space-y-2">
                    {guide.parts.map((part, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        {part.url ? (
                          <a
                            href={part.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {part.text}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">{part.text}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Step-by-Step Guide</CardTitle>
              <CardDescription className="mt-1">
                {completedSteps.size} of {guide.steps?.length || 0} steps completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((completedSteps.size / (guide.steps?.length || 1)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {guide.steps?.map((step, idx) => {
              const isCompleted = completedSteps.has(idx)
              const isLast = idx === (guide.steps?.length || 0) - 1

              return (
                <div key={idx} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div
                      className={`absolute left-6 top-12 h-full w-0.5 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}

                  {/* Step content */}
                  <div className="flex gap-4">
                    {/* Step number circle */}
                    <button
                      onClick={() => toggleStepCompletion(idx)}
                      className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background transition-all hover:scale-110"
                      style={{
                        borderColor: isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                      )}
                    </button>

                    {/* Step details */}
                    <div className="flex-1 pb-2">
                      <div
                        className={`rounded-lg border-2 p-6 transition-all ${
                          isCompleted ? "border-primary/20 bg-primary/5" : "border-muted bg-card"
                        }`}
                      >
                        <h3 className="mb-4 text-xl font-semibold">
                          {step.title || `Step ${idx + 1}`}
                        </h3>

                        {step.media?.data?.[0] && (
                          <div className="mb-4 overflow-hidden rounded-lg">
                            <img
                              src={step.media.data[0].large || "/placeholder.svg"}
                              alt={`Step ${idx + 1}`}
                              className="w-full"
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          {step.lines?.map((line, lineIdx) => (
                            <div
                              key={lineIdx}
                              className="flex items-start gap-3"
                            >
                              <Circle className="mt-1 h-2 w-2 flex-shrink-0 fill-primary text-primary" />
                              <div
                                className="text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: line.text_rendered }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {guide.conclusion_rendered && (
        <Card>
          <CardHeader>
            <CardTitle>Conclusion</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: guide.conclusion_rendered }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
