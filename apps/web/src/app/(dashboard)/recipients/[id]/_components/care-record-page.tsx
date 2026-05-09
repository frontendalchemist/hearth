"use client"

import * as React from "react"
import type { Route } from "next"
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Compass,
  Heart,
  Map as MapIcon,
  Search,
  Share2,
  Sparkles,
  UserCircle2,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  CareModuleTile,
  EmptyState,
  QuickActions,
  SectionLabel,
  type CareStage,
  type QuickAction,
} from "@/components/shared"
import {
  useCareRecipientQuery,
  type CareRecipient,
  type GqlCareStage,
} from "@/lib/graphql/queries/care-recipients"

const CARE_STAGE_TO_NUMERIC: Record<GqlCareStage, CareStage> = {
  STAGE_1_INDEPENDENT: 1,
  STAGE_2_SOME_HELP: 2,
  STAGE_3_ASSISTED_LIVING: 3,
  STAGE_4_MEMORY_CARE: 4,
  STAGE_5_END_OF_LIFE: 5,
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

export function CareRecordPage({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useCareRecipientQuery(id)

  if (isLoading) return <CareRecordSkeleton />
  if (error) return <CareRecordError onRetry={() => refetch()} />
  if (!data) return <CareRecordNotFound />

  return <CareRecordView recipient={data} />
}

function CareRecordView({ recipient }: { recipient: CareRecipient }) {
  const fullName = [recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const stage = CARE_STAGE_TO_NUMERIC[recipient.careStage]
  const initials = getInitials(recipient.firstName, recipient.lastName)

  // Stub destinations — real targets ship in later sprints (Emergency Packet
  // in Sprint 5, AI Assistant in Sprint 13). Buttons render now so the route
  // shape is right when the targets land.
  const quickActions: QuickAction[] = [
    {
      label: "Emergency share packet",
      icon: AlertTriangle,
      href: `/recipients/${recipient.id}/share/emergency` as Route,
      variant: "destructive",
    },
    {
      label: "Share care summary",
      icon: Share2,
      href: `/recipients/${recipient.id}/share/summary` as Route,
    },
    {
      label: `Ask AI about ${recipient.firstName}`,
      icon: Sparkles,
      href: `/ai-assistant?recipientId=${recipient.id}` as Route,
    },
  ]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/dashboard" as Route },
          { label: fullName },
        ]}
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-hearth-orange-50 font-serif text-2xl text-hearth-orange-700"
          >
            {initials || <UserCircle2 className="h-8 w-8" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl text-foreground">{fullName}</h1>
            <p className="mt-1 text-muted-foreground">
              {(recipient.relationship ?? "Care recipient")}
              {recipient.age != null ? ` · age ${recipient.age}` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
            STAGE_BADGE_CLASS[stage],
          )}
        >
          {STAGE_LABEL[stage]}
        </span>
      </header>

      <section
        aria-labelledby="needs-attention"
        className="flex flex-col gap-3"
      >
        <SectionLabel id="needs-attention">Needs attention</SectionLabel>
        <div className="rounded-xl border border-dashed border-border bg-muted/30">
          <EmptyState
            icon={Bell}
            title="No urgent items right now"
            description="Alerts about expiring documents, missed medications, and upcoming appointments will appear here once Health Hub is connected."
          />
        </div>
      </section>

      <section aria-label="Quick actions" className="flex flex-col gap-3">
        <SectionLabel>Quick actions</SectionLabel>
        <QuickActions actions={quickActions} />
      </section>

      <section aria-labelledby="care-modules" className="flex flex-col gap-4">
        <SectionLabel id="care-modules">Care modules</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <CareModuleTile
            status="active"
            href={`/recipients/${recipient.id}/workspace` as Route}
            icon={Briefcase}
            title="Family Workspace"
            description="Tasks, care log, and family coordination"
          />
          <CareModuleTile
            status="coming-soon"
            icon={Heart}
            title="Health Hub"
            description="Medications, appointments, providers"
          />
          <CareModuleTile
            status="coming-soon"
            icon={Search}
            title="Care Finder"
            description="Compare assisted living, home care, and more"
          />
          <CareModuleTile
            status="coming-soon"
            icon={Wallet}
            title="Money & Coverage"
            description="Insurance, benefits, and out-of-pocket costs"
          />
          <CareModuleTile
            status="coming-soon"
            icon={Compass}
            title="Stage Navigator"
            description="What to expect, and what to do next"
          />
        </div>
      </section>
    </div>
  )
}

function getInitials(first: string, last: string): string {
  const f = first.trim().charAt(0).toUpperCase()
  const l = last.trim().charAt(0).toUpperCase()
  return `${f}${l}`
}

function CareRecordSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex max-w-5xl flex-col gap-8"
    >
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function CareRecordError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="text-sm text-destructive">
        We couldn&apos;t load this care record. The connection may have dropped
        — give it another try.
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  )
}

function CareRecordNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/dashboard" as Route },
          { label: "Not found" },
        ]}
      />
      <EmptyState
        icon={MapIcon}
        title="Care record not found"
        description="This care recipient doesn't exist, or you don't have access to it."
        action={
          <Button asChild variant="default" size="lg">
            <a href="/dashboard">Back to home</a>
          </Button>
        }
      />
    </div>
  )
}
