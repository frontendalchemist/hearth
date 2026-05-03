// All date display in the app routes through this helper. Direct calls to
// Date.prototype.toLocaleString / toLocaleDateString / toLocaleTimeString and
// hardcoded BCP-47 tags are forbidden — a CI grep guard fails the build if
// any reappear. The user's locale comes from `User.locale` (exposed via
// `requireAuth().locale`); never assume it.
export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale, options).format(d)
}
