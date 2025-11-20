"use client"

import { useI18n } from "@/lib/i18n/context"

export function DiagnosisHistoryHeader() {
  const { t } = useI18n()
  
  return (
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold">{t.history.myHistory}</h1>
      <p className="text-muted-foreground">
        {t.history.viewAll}
      </p>
    </div>
  )
}

