import * as React from "react"
import { cn } from "@/lib/utils"

export interface Stat {
  label: string
  value: string | number
}

interface StatsRowProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: Stat[]
}

export function StatsRow({ stats, className, ...props }: StatsRowProps) {
  return (
    <div
      role="list"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {stats.map((stat, idx) => (
        <React.Fragment key={stat.label}>
          {idx > 0 && (
            <span aria-hidden="true" className="text-muted-foreground/60">
              ·
            </span>
          )}
          <span role="listitem">
            <span className="font-medium text-foreground">{stat.value}</span>{" "}
            {stat.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}
