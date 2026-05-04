import { requireAuth } from "@/lib/auth";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import React from "react";
import { OnboardingWizard } from "./wizard";
import { Route } from "next";

/** checks for auth, then if user has completed onboarding
 * redirects to main dashboard
 */
export default async function OnboardingPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login" as Route);
  }

  if (await hasCompletedOnboarding(user.id)) {
    redirect("/dashboard" as Route);
  }

  return <OnboardingWizard initialName={user.name} locale={user.locale} />;
}
