/**
 * Locale-aware formatting shared by the user console.
 *
 * The admin console has its own copies of these in app/[locale]/admin/helpers.ts,
 * but those hardcode Spanish ("ahora", "es-ES"), which is fine for an internal
 * tool and wrong for a user-facing surface in two locales.
 */

/** Compact relative time: "ahora", "5m", "3h", "2d", "4mo". */
export function timeAgo(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return "";

  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });

  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.floor(months / 12), "year");
}

/** Absolute date for tooltips and detail rows. */
export function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Runtime as m:ss. */
export function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return "";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
