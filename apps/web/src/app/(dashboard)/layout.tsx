import { redirect } from "next/navigation";
import type { Route } from "next";
import { requireAuth } from "@/lib/auth";
import { hasAcceptedAllRequired } from "@/lib/consent";
import { Shell } from "@/components/shared";
import { QueryProvider } from "@/components/providers/query-provider";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAuth() syncs the User row and gives us the cuid we need for the
  // consent lookup; it throws a 401 Response on no session, which a layout
  // can't surface, so catch and redirect to login (mirroring requireSession).
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/login" as Route);
  }

  // Gate every authenticated dashboard render on having accepted the current
  // version of every required consent. Bumping a version in `consent.ts`
  // re-prompts all users automatically.
  if (!(await hasAcceptedAllRequired(user.id))) {
    redirect("/consent" as Route);
  }

  if (!(await hasCompletedOnboarding(user.id))) {
    redirect("/onboarding" as Route);
  }

  return (
    <QueryProvider>
      <Shell>{children}</Shell>
    </QueryProvider>
  );
}
