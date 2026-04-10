import type { HabitCheckIn } from "@prisma/client";
import { calculateStreak } from "./streak";

export type AchievementId =
  | "first_checkin"
  | "first_done"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "streak_100"
  | "completions_10"
  | "completions_50"
  | "completions_100"
  | "completions_500"
  | "perfect_week"
  | "night_owl"
  | "early_bird"
  | "comeback_kid";

export type Achievement = {
  id: AchievementId;
  name: string;
  description: string;
  emoji: string;
  color: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlockedAt?: string; // ISO date string
};

export const ACHIEVEMENT_DEFS: Omit<Achievement, "unlockedAt">[] = [
  {
    id: "first_checkin",
    name: "First Step",
    description: "Logged your very first check-in",
    emoji: "👟",
    color: "#f97316",
    tier: "bronze",
  },
  {
    id: "first_done",
    name: "Done!",
    description: "Completed a habit for the first time",
    emoji: "✅",
    color: "#22c55e",
    tier: "bronze",
  },
  {
    id: "completions_10",
    name: "Getting Started",
    description: "10 total habit completions",
    emoji: "🌱",
    color: "#84cc16",
    tier: "bronze",
  },
  {
    id: "completions_50",
    name: "On a Roll",
    description: "50 total habit completions",
    emoji: "🔥",
    color: "#f97316",
    tier: "silver",
  },
  {
    id: "completions_100",
    name: "Century Club",
    description: "100 total habit completions",
    emoji: "💯",
    color: "#f59e0b",
    tier: "gold",
  },
  {
    id: "completions_500",
    name: "Habit Machine",
    description: "500 total habit completions",
    emoji: "⚡",
    color: "#eab308",
    tier: "platinum",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Reached a 7-day streak",
    emoji: "🗓️",
    color: "#3b82f6",
    tier: "bronze",
  },
  {
    id: "streak_14",
    name: "Two Weeks Strong",
    description: "Reached a 14-day streak",
    emoji: "🏅",
    color: "#6366f1",
    tier: "silver",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Reached a 30-day streak",
    emoji: "🏆",
    color: "#8b5cf6",
    tier: "gold",
  },
  {
    id: "streak_100",
    name: "Century Streak",
    description: "Reached a 100-day streak",
    emoji: "👑",
    color: "#a855f7",
    tier: "platinum",
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Completed all habits 7 days in a row",
    emoji: "⭐",
    color: "#f59e0b",
    tier: "gold",
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Returned after missing 3+ days",
    emoji: "🔄",
    color: "#14b8a6",
    tier: "silver",
  },
];

export type AchievementResult = Achievement & { unlocked: boolean };

export function computeAchievements(
  habits: Array<{
    id: string;
    checkIns: HabitCheckIn[];
    frequencyType: string;
    frequencyDays: number;
    targetValue: number | null;
    streakFreeze: boolean;
    createdAt: Date;
  }>
): AchievementResult[] {
  const allCheckIns = habits.flatMap((h) => h.checkIns);
  const doneCheckIns = allCheckIns.filter((ci) => ci.status === "DONE" || ci.status === "PARTIAL");
  const totalDone = doneCheckIns.length;

  // Best streak across all habits
  let bestEverStreak = 0;
  for (const h of habits) {
    const s = calculateStreak(h.checkIns, {
      frequencyType: h.frequencyType as "DAILY" | "WEEKLY" | "CUSTOM",
      frequencyDays: h.frequencyDays,
      targetValue: h.targetValue,
      streakFreeze: h.streakFreeze,
    });
    if (s.bestStreak > bestEverStreak) bestEverStreak = s.bestStreak;
  }

  // Perfect week: find 7 consecutive days where every habit was completed
  const hasPerfectWeek = checkPerfectWeek(habits);

  // Comeback kid: check-in after a 3+ day gap
  const hasComebackKid = checkComebackKid(allCheckIns);

  // Earliest check-in date for "first"
  const sortedDates = doneCheckIns
    .map((ci) => ci.date)
    .sort();

  const firstDoneDate = sortedDates[0] ?? null;
  const firstCheckInDate = allCheckIns
    .map((ci) => ci.date)
    .sort()[0] ?? null;

  const results: AchievementResult[] = ACHIEVEMENT_DEFS.map((def) => {
    let unlocked = false;
    let unlockedAt: string | undefined;

    switch (def.id) {
      case "first_checkin":
        unlocked = firstCheckInDate != null;
        unlockedAt = firstCheckInDate ?? undefined;
        break;
      case "first_done":
        unlocked = firstDoneDate != null;
        unlockedAt = firstDoneDate ?? undefined;
        break;
      case "completions_10":
        unlocked = totalDone >= 10;
        if (unlocked) unlockedAt = sortedDates[9];
        break;
      case "completions_50":
        unlocked = totalDone >= 50;
        if (unlocked) unlockedAt = sortedDates[49];
        break;
      case "completions_100":
        unlocked = totalDone >= 100;
        if (unlocked) unlockedAt = sortedDates[99];
        break;
      case "completions_500":
        unlocked = totalDone >= 500;
        if (unlocked) unlockedAt = sortedDates[499];
        break;
      case "streak_7":
        unlocked = bestEverStreak >= 7;
        break;
      case "streak_14":
        unlocked = bestEverStreak >= 14;
        break;
      case "streak_30":
        unlocked = bestEverStreak >= 30;
        break;
      case "streak_100":
        unlocked = bestEverStreak >= 100;
        break;
      case "perfect_week":
        unlocked = hasPerfectWeek;
        break;
      case "comeback_kid":
        unlocked = hasComebackKid;
        break;
    }

    return { ...def, unlocked, unlockedAt };
  });

  return results;
}

function checkPerfectWeek(
  habits: Array<{ id: string; checkIns: HabitCheckIn[]; createdAt: Date }>
): boolean {
  if (habits.length === 0) return false;

  // Build a map of date → set of habit ids that were completed
  const completedByDate = new Map<string, Set<string>>();
  for (const h of habits) {
    for (const ci of h.checkIns) {
      if (ci.status === "DONE" || ci.status === "PARTIAL") {
        if (!completedByDate.has(ci.date)) completedByDate.set(ci.date, new Set());
        completedByDate.get(ci.date)!.add(ci.habitId);
      }
    }
  }

  // Check any 7 consecutive dates where all habits that existed were completed
  const dates = Array.from(completedByDate.keys()).sort();
  for (let i = 0; i <= dates.length - 7; i++) {
    const window = dates.slice(i, i + 7);
    let consecutive = true;
    for (let j = 1; j < 7; j++) {
      const prev = new Date(window[j - 1]);
      const curr = new Date(window[j]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff !== 1) { consecutive = false; break; }
    }
    if (!consecutive) continue;

    let allPerfect = true;
    for (const date of window) {
      const eligible = habits.filter((h) => new Date(h.createdAt) <= new Date(date));
      if (eligible.length === 0) { allPerfect = false; break; }
      const completed = completedByDate.get(date);
      const allDone = eligible.every((h) => completed?.has(h.id));
      if (!allDone) { allPerfect = false; break; }
    }
    if (allPerfect) return true;
  }
  return false;
}

function checkComebackKid(checkIns: HabitCheckIn[]): boolean {
  if (checkIns.length < 2) return false;
  const dates = [...new Set(checkIns.map((ci) => ci.date))].sort();
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff >= 3) return true;
  }
  return false;
}
