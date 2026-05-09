import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import { ArrowRight, Lock, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface ActiveTileProps {
  status: "active"
  href: Route
}

interface ComingSoonTileProps {
  status: "coming-soon"
  href?: never
}

type CareModuleTileProps = (ActiveTileProps | ComingSoonTileProps) & {
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

export function CareModuleTile(props: CareModuleTileProps) {
  const { title, description, icon: Icon, className, status } = props
  const isActive = status === "active"

  return (
    <Card
      className={cn(
        "group relative gap-3 overflow-hidden p-6",
        isActive
          ? "transition-shadow hover:shadow-md"
          : "border-dashed bg-muted/40",
        className,
      )}
    >
      {isActive && (
        <Link
          href={props.href}
          aria-label={`Open ${title}`}
          className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      )}
      <div
        className={cn(
          "relative z-10 pointer-events-none flex flex-col gap-3",
          !isActive && "opacity-70",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isActive
                ? "bg-hearth-orange-50 text-hearth-orange-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {!isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Coming soon
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isActive && (
          <div className="flex items-center justify-end gap-1 pt-1 text-sm font-medium text-primary">
            Open
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
