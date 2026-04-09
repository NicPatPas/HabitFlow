import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, parseISO, getDay, startOfMonth, endOfMonth } from "date-fns";
import { CheckInRecord } from "./streak";

export type DayOfWeekStats = {
  day: string; // "Mon", "Tue", etc.
  completionRate: number;
  total: number;
  completed: number;
};

export type WeeklyChartPoint = {
  week: string; // e.g. "Apr 1"
  completionRate: number;
  completed: number;
  total: number;
};

export type DailyChartPoint = {
  date: string; // YYYY-MM-DD
  completed: number;
  total: number;
  completionRate: number;
};

export type HeatmapCell = {
  date: string;
  count: number; // 0-4 intensity
  completionRate: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Completion rate by day of week (0=Sun ... 6=Sat)
 */
export function getDayOfWeekStats(
  checkIns: CheckInRecord[],
  targetValue?: number | null
): DayOfWeekStats[] {
  const buckets: Record<number, { total: number; completed: number }> = {};
  for (let i = 0; i < 7; i++) buckets[i] = { total: 0, completed: 0 };

  for (const ci of checkIns) {
    const dow = getDay(parseISO(ci.date));
    buckets[dow].total++;
    if (ci.status === "DONE") buckets[dow].completed++;
    else if (ci.status === "PARTIAL" && targetValue && ci.valueCompleted != null) {
      if (ci.valueCompleted / targetValue >= 0.8) buckets[dow].completed++;
    }
  }

  return Object.entries(buckets).map(([dow, b]) => ({
    day: DAY_NAMES[parseInt(dow)],
    completionRate: b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0,
    total: b.total,
    completed: b.completed,
  }));
}

/**
 * Weekly completion chart for the past N weeks
 */
export function getWeeklyChart(
  allCheckIns: Array<{ habitId: string; date: string; status: string }>,
  habitCount: number,
  weeks: number = 12
): WeeklyChartPoint[] {
  const today = new Date();
  const points: WeeklyChartPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd > today ? today : weekEnd });

    const dayStrings = new Set(days.map((d) => format(d, "yyyy-MM-dd")));
    const weekCheckIns = allCheckIns.filter((ci) => dayStrings.has(ci.date));

    const total = weekCheckIns.length;
    const completed = weekCheckIns.filter((ci) => ci.status === "DONE" || ci.status === "PARTIAL").length;

    points.push({
      week: format(weekStart, "MMM d"),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    });
  }

  return points;
}

/**
 * Daily chart for the past N days
 */
export function getDailyChart(
  allCheckIns: Array<{ date: string; status: string }>,
  days: number = 30
): DailyChartPoint[] {
  const today = new Date();
  const byDate = new Map<string, { completed: number; total: number }>();

  for (const ci of allCheckIns) {
    const entry = byDate.get(ci.date) ?? { completed: 0, total: 0 };
    entry.total++;
    if (ci.status === "DONE" || ci.status === "PARTIAL") entry.completed++;
    byDate.set(ci.date, entry);
  }

  const points: DailyChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const entry = byDate.get(date) ?? { completed: 0, total: 0 };
    points.push({
      date,
      completed: entry.completed,
      total: entry.total,
      completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
    });
  }

  return points;
}

/**
 * Heatmap data: last 365 days (or N days), intensity 0-4
 */
export function getHeatmapData(
  allCheckIns: Array<{ date: string; status: string }>,
  days: number = 365
): HeatmapCell[] {
  const today = new Date();
  const byDate = new Map<string, { completed: number; total: number }>();

  for (const ci of allCheckIns) {
    const entry = byDate.get(ci.date) ?? { completed: 0, total: 0 };
    entry.total++;
    if (ci.status === "DONE") entry.completed += 1;
    else if (ci.status === "PARTIAL") entry.completed += 0.5;
    byDate.set(ci.date, entry);
  }

  const cells: HeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const entry = byDate.get(date);
    const rate = entry && entry.total > 0 ? entry.completed / entry.total : 0;
    const count = rate === 0 ? 0 : rate < 0.25 ? 1 : rate < 0.5 ? 2 : rate < 0.75 ? 3 : 4;
    cells.push({ date, count, completionRate: Math.round(rate * 100) });
  }

  return cells;
}

/**
 * Average habits completed per day over the past N days
 */
export function getAveragePerDay(
  allCheckIns: Array<{ date: string; status: string }>,
  days: number = 30
): number {
  const today = new Date();
  let totalCompleted = 0;

  for (let i = 0; i < days; i++) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const dayCheckIns = allCheckIns.filter((ci) => ci.date === date);
    totalCompleted += dayCheckIns.filter((ci) => ci.status === "DONE" || ci.status === "PARTIAL").length;
  }

  return Math.round((totalCompleted / days) * 10) / 10;
}

/**
 * Best day of week (highest completion rate)
 */
export function getBestDayOfWeek(stats: DayOfWeekStats[]): string {
  const best = stats.reduce((a, b) => (b.completionRate > a.completionRate ? b : a), stats[0]);
  return best?.day ?? "—";
}
