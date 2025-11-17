"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, DollarSign, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface LeadCardProps {
  lead: any
  onStatusUpdate: (leadId: string, newStatus: string) => Promise<void>
}

export function LeadCard({ lead, onStatusUpdate }: LeadCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(lead.status)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "accepted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return ""
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await onStatusUpdate(lead.id, newStatus)
      setCurrentStatus(newStatus)
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-semibold">{lead.diagnoses.ai_response.probable_issue}</p>
                <p className="mt-1 text-sm text-muted-foreground">{lead.diagnoses.user_input}</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(currentStatus)}>
            {currentStatus}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Est. Cost: {lead.diagnoses.estimated_cost}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(lead.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Update Status:</span>
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {isUpdating && <span className="text-sm text-muted-foreground">Updating...</span>}
          </div>
        </div>

        {lead.diagnoses.ai_response.recommended_action && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-semibold">AI Recommendation:</p>
            <p className="mt-1 text-sm text-muted-foreground">{lead.diagnoses.ai_response.recommended_action}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
