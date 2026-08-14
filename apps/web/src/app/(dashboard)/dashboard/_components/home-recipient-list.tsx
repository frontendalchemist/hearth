"use client";

import * as React from "react";
import type { Route } from "next";
import { UsersRound } from "lucide-react";
import {
  CareRecipientCard,
  EmptyState,
  SectionLabel,
  type CareStage,
} from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useCareRecipientsQuery,
  type GqlCareStage,
  type CareRecipient,
} from "@/lib/graphql/queries/care-recipients";

const CARE_STAGE_TO_NUMERIC: Record<GqlCareStage, CareStage> = {
  STAGE_1_INDEPENDENT: 1,
  STAGE_2_SOME_HELP: 2,
  STAGE_3_ASSISTED_LIVING: 3,
  STAGE_4_MEMORY_CARE: 4,
  STAGE_5_END_OF_LIFE: 5,
};

export function HomeRecipientList() {
  const { data, isLoading, error, refetch } = useCareRecipientsQuery();

  if (isLoading) {
    return <RecipientListSkeleton />;
  }

  if (error) {
    return <RecipientListError onRetry={() => refetch()} />;
  }

  if (!data || data.length === 0) {
    return <RecipientListEmpty />;
  }

  return (
    <section
      aria-labelledby="people-im-caring-for"
      className="flex flex-col gap-4"
    >
      <SectionLabel id="people-im-caring-for">
        People I&apos;m caring for
      </SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((recipient) => (
          <CareRecipientCard
            key={recipient.id}
            name={fullName(recipient)}
            relationship={recipient.relationship ?? "Care recipient"}
            age={recipient.age ?? 0}
            stage={CARE_STAGE_TO_NUMERIC[recipient.careStage]}
            // Per HEA-79: alert count is a placeholder until Health Hub +
            // Alerts ship. The card hides the badge entirely at 0, so a
            // recipient with no alerts looks the same as the future
            // "no-alerts" state.
            alertCount={recipient.activeAlertCount}
            href={`/recipients/${recipient.id}` as Route}
          />
        ))}
      </div>
    </section>
  );
}

function fullName(recipient: CareRecipient): string {
  return [recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function RecipientListSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-4"
    >
      <SectionLabel>People I&apos;m caring for</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

function RecipientListError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>People I&apos;m caring for</SectionLabel>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          We couldn&apos;t load your care recipients. The connection may have
          dropped — give it another try.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
          Try again
        </Button>
      </div>
    </section>
  );
}

function RecipientListEmpty() {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>People I&apos;m caring for</SectionLabel>
      <EmptyState
        icon={UsersRound}
        title="No care recipients yet"
        description="Add the first person you're coordinating care for. You'll be able to manage their documents, medications, and appointments from one place."
        action={
          <Button asChild variant="default" size="lg">
            <a href="/onboarding">Add a care recipient</a>
          </Button>
        }
      />
    </section>
  );
}
