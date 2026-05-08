import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type QuickActionVariant = "primary" | "secondary" | "destructive"

export interface QuickAction {
  label: string
  icon: LucideIcon
  href: Route
  variant?: QuickActionVariant
}

interface QuickActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  actions: QuickAction[]
}

const VARIANT_TO_BUTTON: Record<
  QuickActionVariant,
  "default" | "outline" | "destructive"
> = {
  primary: "default",
  secondary: "outline",
  destructive: "destructive",
}

export function QuickActions({
  actions,
  className,
  ...props
}: QuickActionsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-2",
        className
      )}
      {...props}
    >
      {actions.map(({ label, icon: Icon, href, variant = "secondary" }) => (
        <Button
          key={label}
          asChild
          variant={VARIANT_TO_BUTTON[variant]}
          size="lg"
          className="min-h-11 justify-center"
        >
          <Link href={href}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
