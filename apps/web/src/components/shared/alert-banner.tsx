import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type AlertVariant = "info" | "warning" | "error" | "success"

interface AlertBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  onDismiss?: () => void
}

const VARIANT: Record<
  AlertVariant,
  { container: string; icon: LucideIcon; iconClass: string }
> = {
  info: {
    container: "border-border bg-card text-foreground",
    icon: Info,
    iconClass: "text-muted-foreground",
  },
  success: {
    container: "border-primary/30 bg-primary/5 text-foreground",
    icon: CheckCircle2,
    iconClass: "text-primary",
  },
  warning: {
    container: "border-primary/40 bg-primary/10 text-foreground",
    icon: AlertTriangle,
    iconClass: "text-primary",
  },
  error: {
    container: "border-destructive/40 bg-destructive/10 text-foreground",
    icon: AlertCircle,
    iconClass: "text-destructive",
  },
}

export function AlertBanner({
  variant = "info",
  title,
  description,
  action,
  onDismiss,
  className,
  ...props
}: AlertBannerProps) {
  const { container, icon: Icon, iconClass } = VARIANT[variant]
  const role = variant === "warning" || variant === "error" ? "alert" : "status"

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        container,
        className
      )}
      {...props}
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && (
          <p className={cn("text-sm", title && "mt-1 text-muted-foreground")}>
            {description}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
