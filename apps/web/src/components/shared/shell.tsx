import * as React from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { cn } from "@/lib/utils"

interface ShellProps {
  sidebar?: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Shell({
  sidebar = <SidebarNav />,
  header,
  children,
  className,
}: ShellProps) {
  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header && (
          <header className="border-b border-border bg-card">{header}</header>
        )}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
