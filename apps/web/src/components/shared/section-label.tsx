import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionLabelProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h2" | "h3" | "h4"
}

export function SectionLabel({
  as: Tag = "h2",
  children,
  className,
  ...props
}: SectionLabelProps) {
  return (
    <Tag
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
