import { format, parseISO, isToday, isYesterday, differenceInCalendarDays } from "date-fns";

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function daysSince(dateStr: string): number {
  return differenceInCalendarDays(new Date(), parseISO(dateStr));
}
