"use client"

import { useState, useEffect } from "react"
import { Moon } from "lucide-react"
import { isNightTime } from "./shop-status"

export function NightOverlay() {
  const [isNight, setIsNight] = useState(false)

  useEffect(() => {
    const checkNight = () => {
      setIsNight(isNightTime())
    }

    checkNight()
    // Check every hour
    const interval = setInterval(checkNight, 3600000)

    return () => clearInterval(interval)
  }, [])

  if (!isNight) return null

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 rounded-lg pointer-events-none -z-10">
      <div className="absolute top-2 right-2 opacity-30">
        <Moon className="h-8 w-8 text-blue-300" />
      </div>
    </div>
  )
}

