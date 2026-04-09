import { subDays, format } from "date-fns";
import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

export interface DayStatus {
  date: string;       // "yyyy-MM-dd"
  isPerfect: boolean;
  completionPct: number; // 0–100
  total: number;
  completed: number;
}

export interface PerfectDaySummary {
  history: DayStatus[];   // last N days, newest first
  streak: number;          // consecutive perfect days (ending today or yesterday)
  allTimeBest: number;
  todayStatus: DayStatus;
}

type HabitWithCheckIns = Habit & {
  streak: StreakResult;
  todayCheckIn: HabitCheckIn | null;
  checkIns: HabitCheckIn[];
};

/**
 * Computes perfect-day history from client-side habit data.
 * A "perfect day" = every habit that existed on that date was DONE or PARTIAL.
 */
export function computePerfectDays(
  habits: HabitWithCheckIns[],
  lookbackDays = 14
): PerfectDaySummary {
  const history: DayStatus[] = [];

  for (let i = 0; i < lookbackDays; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");

    // Only count habits that existed on or before this date
    const active = habits.filter(
      (h) => format(new Date(h.createdAt), "yyyy-MM-dd") <= date
    );

    if (active.length === 0) {
      history.push({ date, isPerfect: false, completionPct: 0, total: 0, completed: 0 });
      continue;
    }

    const completed = active.filter((h) => {
      const ci = h.checkIns.find((c) => c.date === date);
      return ci?.status === "DONE" || ci?.status === "PARTIAL";
    }).length;

    const completionPct =
      active.length > 0 ? Math.round((completed / active.length) * 100) : 0;

    history.push({
      date,
      isPerfect: completionPct === 100 && active.length > 0,
      completionPct,
      total: active.length,
      completed,
    });
  }

  // Perfect day streak: consecutive days from today backward
  let streak = 0;
  for (const day of history) {
    // Today being incomplete doesn't break the streak yet
    if (day === history[0] && !day.isPerfect) {
      continue;
    }
    if (day.isPerfect) streak++;
    else break;
  }

  // All-time best streak (over the window we have)
  let best = 0;
  let current = 0;
  for (const day of [...history].reverse()) {
    if (day.isPerfect) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  best = Math.max(best, streak);

  return {
    history,
    streak,
    allTimeBest: best,
    todayStatus: history[0],
  };
}
