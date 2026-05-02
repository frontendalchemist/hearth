import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type CareStage = 1 | 2 | 3 | 4 | 5

interface CareRecipientCardProps {
  name: string
  relationship: string
  age: number
  stage: CareStage
  alertCount: number
  href: Route
  className?: string
}

const STAGE_LABEL: Record<CareStage, string> = {
  1: "Stage 1 · Independent",
  2: "Stage 2 · Some support",
  3: "Stage 3 · Active care",
  4: "Stage 4 · Daily care",
  5: "Stage 5 · End-of-life",
}

const STAGE_BADGE_CLASS: Record<CareStage, string> = {
  1: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  2: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  3: "bg-amber-100 text-amber-900 ring-amber-200",
  4: "bg-orange-100 text-orange-900 ring-orange-200",
  5: "bg-orange-100 text-orange-900 ring-orange-200",
}

export function CareRecipientCard({
  name,
  relationship,
  age,
  stage,
  alertCount,
  href,
  className,
}: CareRecipientCardProps) {
  const alertLabel = alertCount === 1 ? "alert" : "alerts"

  return (
    <Card
      className={cn(
        "group relative gap-3 overflow-hidden p-6 transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link
        href={href}
        aria-label={`Open care record for ${name}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="relative z-10 pointer-events-none flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {relationship} · age {age}
            </p>
          </div>
          {alertCount > 0 && (
            <Badge
              variant="destructive"
              aria-label={`${alertCount} ${alertLabel} needing attention`}
            >
              {alertCount} {alertLabel}
            </Badge>
          )}
        </div>
        <div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              STAGE_BADGE_CLASS[stage]
            )}
          >
            {STAGE_LABEL[stage]}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1 pt-2 text-sm font-medium text-primary">
          Open care record
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </Card>
  )
}
