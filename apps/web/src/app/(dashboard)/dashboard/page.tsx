import type { Route } from "next"
import {
  AlertTriangle,
  CalendarHeart,
  Share2,
  Sparkles,
} from "lucide-react"
import { requireAuth } from "@/lib/auth"
import {
  PageHeader,
  QuickActions,
  type QuickAction,
} from "@/components/shared"
import { HomeRecipientList } from "./_components/home-recipient-list"
import { timeOfDayGreeting } from "@/lib/format/greeting"

// Stub destinations — Quick Actions wire up to real flows in later sprints.
// The Emergency Packet ships in Sprint 5 (HEA-? in milestone Sprint 5–6),
// the AI Assistant in Sprint 13. Family meeting agenda is Sprint 7. We give
// these placeholders so the buttons render now and the redirects light up
// when the targets land — no need to retouch this page.
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Emergency share packet",
    icon: AlertTriangle,
    href: "/share/emergency" as Route,
    variant: "destructive",
  },
  {
    label: "Share care summary",
    icon: Share2,
    href: "/share/summary" as Route,
  },
  {
    label: "Family meeting agenda",
    icon: CalendarHeart,
    href: "/family-meeting" as Route,
  },
  {
    label: "Ask AI Assistant",
    icon: Sparkles,
    href: "/ai-assistant" as Route,
  },
]

export default async function DashboardPage() {
  // The dashboard layout already calls requireAuth() and gates onboarding +
  // consent. Calling again here is a within-request cache hit, and gives us
  // the user.name for the greeting without threading props through the
  // layout (which can't pass props to its children).
  const user = await requireAuth()

  const firstName = user.name.split(" ")[0] ?? user.name

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <PageHeader
        title={`${timeOfDayGreeting()}, ${firstName}`}
        subtitle="Your family care hub — everyone in one place."
      />

      <section aria-label="Quick actions" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h2>
        <QuickActions actions={QUICK_ACTIONS} />
      </section>

      <HomeRecipientList />
    </div>
  )
}
