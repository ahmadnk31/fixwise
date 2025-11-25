"use client"

import { useState, useEffect } from "react"
import { Clock, Moon, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

interface ShopStatusProps {
  openingHours: OpeningHours
  showNightOverlay?: boolean
}

function getDayName(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  return days[new Date().getDay()]
}

function isTimeBetween(time: string, start: string, end: string): boolean {
  const [timeHour, timeMin] = time.split(":").map(Number)
  const [startHour, startMin] = start.split(":").map(Number)
  const [endHour, endMin] = end.split(":").map(Number)

  const timeMinutes = timeHour * 60 + timeMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return timeMinutes >= startMinutes && timeMinutes < endMinutes
}

export function isNightTime(): boolean {
  const hour = new Date().getHours()
  // Night time: 8 PM (20:00) to 6 AM (06:00)
  return hour >= 20 || hour < 6
}

export function ShopStatus({ openingHours, showNightOverlay = false }: ShopStatusProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [nightTime, setNightTime] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date()
      const currentHour = now.getHours().toString().padStart(2, "0")
      const currentMin = now.getMinutes().toString().padStart(2, "0")
      const time = `${currentHour}:${currentMin}`
      setCurrentTime(time)
      setNightTime(isNightTime())

      const today = getDayName()
      const todayHours = openingHours[today]

      if (!todayHours || todayHours.closed) {
        setIsOpen(false)
        return
      }

      const open = isTimeBetween(time, todayHours.open, todayHours.close)
      setIsOpen(open)
    }

    updateStatus()
    // Update every minute
    const interval = setInterval(updateStatus, 60000)

    return () => clearInterval(interval)
  }, [openingHours])

  if (isOpen === null) {
    return null
  }

  return (
    <div className="relative">
      {showNightOverlay && nightTime && (
        <div className="absolute -inset-2 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-indigo-900/30 rounded-lg pointer-events-none blur-sm" />
      )}
      <div className="relative flex items-center gap-1.5 flex-wrap">
        {nightTime ? (
          <Moon className="h-4 w-4 text-blue-400 flex-shrink-0" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        )}
        <Badge
          variant={isOpen ? "default" : "secondary"}
          className={`${isOpen ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} flex-shrink-0`}
        >
          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="whitespace-nowrap text-xs">{isOpen ? "Open Now" : "Closed"}</span>
        </Badge>
        {currentTime && (
          <span className="text-xs text-white/80 whitespace-nowrap flex-shrink-0">({currentTime})</span>
        )}
      </div>
    </div>
  )
}

