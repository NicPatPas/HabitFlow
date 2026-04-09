/**
 * Streak Engine
 *
 * Rules:
 * - DAILY habit: streak continues for each consecutive day with status DONE
 *   (PARTIAL counts if valueCompleted >= 80% of target, or no target set)
 *   SKIPPED does NOT extend streak but does NOT break it if streakFreeze is enabled
 *   FAILED breaks the streak
 *   Missing day (no check-in) breaks the streak
 *
 * - WEEKLY/CUSTOM habit: streak is measured in weeks
 *   A week is "completed" if the number of DONE check-ins >= frequencyDays target
 *   PARTIAL check-ins count as 0.5 toward the weekly count
 *   A missed week (insufficient completions) breaks the weekly streak
 *
 * - Comeback streak: if user resumes after a break, we track a new streak from resume date
 * - Best streak: stored per habit as max streak ever achieved
 */

import { startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, format, parseISO, differenceInCalendarDays, subDays, isAfter, isBefore, isEqual } from "date-fns";

export type CheckInRecord = {
  date: string; // YYYY-MM-DD
  status: "DONE" | "PARTIAL" | "SKIPPED" | "FAILED";
  valueCompleted?: number | null;
  targetValueSnapshot?: number | null;
};

export type HabitStreakConfig = {
  frequencyType: "DAILY" | "WEEKLY" | "CUSTOM";
  frequencyDays: number; // weekly target
  targetValue?: number | null;
  streakFreeze?: boolean;
};

export type StreakResult = {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  comebackStreak: number; // streak after most recent gap
  totalCompleted: number;
  completionRate: number; // 0-100
};

/**
 * Returns true if a single check-in counts as "completed" for streak purposes
 */
function isCompletedCheckIn(
  checkIn: CheckInRecord,
  config: HabitStreakConfig
): boolean {
  if (checkIn.status === "DONE") return true;
  if (checkIn.status === "PARTIAL") {
    // Partial counts if >= 80% of numeric target, or no target (subjective partial = not done)
    if (config.targetValue && checkIn.valueCompleted != null) {
      return checkIn.valueCompleted / config.targetValue >= 0.8;
    }
    return false; // No target: partial is not enough
  }
  return false;
}

/**
 * Returns true if check-in should NOT break a streak (skipped with freeze or just skipped)
 */
function isStreakSafe(checkIn: CheckInRecord, config: HabitStreakConfig): boolean {
  return checkIn.status === "SKIPPED";
}

/**
 * Calculate streak for a DAILY habit
 * Processes check-ins sorted oldest→newest
 */
function calcDailyStreak(
  checkIns: CheckInRecord[],
  config: HabitStreakConfig
): StreakResult {
  if (checkIns.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null, comebackStreak: 0, totalCompleted: 0, completionRate: 0 };
  }

  const byDate = new Map<string, CheckInRecord>();
  for (const ci of checkIns) byDate.set(ci.date, ci);

  const sortedDates = Array.from(byDate.keys()).sort();
  const firstDate = sortedDates[0];
  const today = format(new Date(), "yyyy-MM-dd");

  // Build day-by-day status from first check-in to today
  const startDate = parseISO(firstDate);
  const endDate = parseISO(today);
  const allDays = eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
    format(d, "yyyy-MM-dd")
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;
  let lastCompletedDate: string | null = null;
  let totalCompleted = 0;
  let inBreak = false;
  let comebackStart: string | null = null;
  let comebackStreak = 0;

  for (const day of allDays) {
    const ci = byDate.get(day);

    if (!ci) {
      // No check-in = missed day = breaks streak
      if (runningStreak > 0) inBreak = true;
      runningStreak = 0;
      continue;
    }

    if (isCompletedCheckIn(ci, config)) {
      totalCompleted++;
      lastCompletedDate = day;
      runningStreak++;
      if (inBreak) {
        comebackStart = day;
        inBreak = false;
      }
      bestStreak = Math.max(bestStreak, runningStreak);
    } else if (isStreakSafe(ci, config)) {
      // Skipped: doesn't extend, doesn't break
      continue;
    } else {
      // FAILED or PARTIAL below threshold
      if (runningStreak > 0) inBreak = true;
      runningStreak = 0;
    }
  }

  currentStreak = runningStreak;

  // Comeback = streak from the most recent resume after a break
  if (comebackStart) {
    comebackStreak = 0;
    let countingComeback = false;
    let tempStreak = 0;
    for (const day of allDays) {
      if (day < comebackStart) continue;
      const ci = byDate.get(day);
      if (!ci) { tempStreak = 0; continue; }
      if (isCompletedCheckIn(ci, config)) {
        tempStreak++;
        comebackStreak = tempStreak;
      } else if (!isStreakSafe(ci, config)) {
        tempStreak = 0;
      }
    }
  }

  const totalDays = allDays.length;
  const completionRate = totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;

  return { currentStreak, bestStreak, lastCompletedDate, comebackStreak, totalCompleted, completionRate };
}

/**
 * Calculate streak for a WEEKLY habit
 * Streak is counted in weeks. A week is complete if DONE count >= frequencyDays target.
 */
function calcWeeklyStreak(
  checkIns: CheckInRecord[],
  config: HabitStreakConfig
): StreakResult {
  if (checkIns.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null, comebackStreak: 0, totalCompleted: 0, completionRate: 0 };
  }

  const byDate = new Map<string, CheckInRecord>();
  for (const ci of checkIns) byDate.set(ci.date, ci);

  const sortedDates = Array.from(byDate.keys()).sort();
  const today = new Date();
  const firstDate = parseISO(sortedDates[0]);

  // Enumerate weeks from first check-in week to current week
  const weeks = eachWeekOfInterval(
    { start: startOfWeek(firstDate, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) },
    { weekStartsOn: 1 }
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;
  let lastCompletedDate: string | null = null;
  let totalCompleted = 0;
  let totalWeeks = 0;
  let inBreak = false;
  let comebackStreak = 0;
  let comebackRunning = 0;

  for (const weekStart of weeks) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const isCurrentWeek = !isAfter(weekStart, today) && !isBefore(weekEnd, today);

    // Count completions in this week
    const days = eachDayOfInterval({ start: weekStart, end: isCurrentWeek ? today : weekEnd });
    let weekScore = 0;
    let lastDone: string | null = null;

    for (const day of days) {
      const dayStr = format(day, "yyyy-MM-dd");
      const ci = byDate.get(dayStr);
      if (!ci) continue;
      if (isCompletedCheckIn(ci, config)) {
        weekScore += 1;
        lastDone = dayStr;
      } else if (ci.status === "PARTIAL") {
        weekScore += 0.5;
        lastDone = dayStr;
      }
    }

    totalWeeks++;
    const weekComplete = weekScore >= config.frequencyDays;

    if (weekComplete) {
      totalCompleted++;
      lastCompletedDate = lastDone;
      runningStreak++;
      bestStreak = Math.max(bestStreak, runningStreak);
      if (inBreak) {
        inBreak = false;
        comebackRunning = 1;
      } else if (comebackRunning > 0) {
        comebackRunning++;
      }
      comebackStreak = Math.max(comebackStreak, comebackRunning);
    } else if (!isCurrentWeek) {
      if (runningStreak > 0) inBreak = true;
      runningStreak = 0;
      comebackRunning = 0;
    }
  }

  currentStreak = runningStreak;
  const completionRate = totalWeeks > 0 ? Math.round((totalCompleted / totalWeeks) * 100) : 0;

  return { currentStreak, bestStreak, lastCompletedDate, comebackStreak: comebackStreak, totalCompleted, completionRate };
}

/**
 * Main entry point: calculate streak for any habit
 */
export function calculateStreak(
  checkIns: CheckInRecord[],
  config: HabitStreakConfig
): StreakResult {
  if (config.frequencyType === "DAILY") {
    return calcDailyStreak(checkIns, config);
  } else {
    return calcWeeklyStreak(checkIns, config);
  }
}

/**
 * Get aggregated streak info across all habits for the dashboard
 */
export type GlobalStreakSummary = {
  totalActiveStreaks: number;
  longestCurrentStreak: number;
  longestEverStreak: number;
  totalHabitsOnStreak: number; // habits with streak > 0
};

export function getGlobalStreakSummary(
  habitStreaks: Array<StreakResult>
): GlobalStreakSummary {
  const active = habitStreaks.filter((s) => s.currentStreak > 0);
  return {
    totalActiveStreaks: active.reduce((sum, s) => sum + s.currentStreak, 0),
    longestCurrentStreak: Math.max(0, ...habitStreaks.map((s) => s.currentStreak)),
    longestEverStreak: Math.max(0, ...habitStreaks.map((s) => s.bestStreak)),
    totalHabitsOnStreak: active.length,
  };
}
