/**
 * Returns the greeting for the current local hour. Pure on the input, so
 * tests pass an explicit `now` to pin the time of day.
 *
 * Hardcoded English for Sprint 1–2; once next-intl coverage extends to the
 * dashboard surface, swap to a locale-aware variant via `t('home.greeting',
 * { period })`.
 */
export function timeOfDayGreeting(now: Date = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}
