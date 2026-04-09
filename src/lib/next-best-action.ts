import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

export type HabitForNBA = Habit & {
  streak: StreakResult;
  todayCheckIn: HabitCheckIn | null;
};

export type ActionType = "quick-complete" | "increment" | "open-modal";
export type UrgencyType = "streak-risk" | "nearly-done" | "normal";

export interface NextBestAction {
  habit: HabitForNBA;
  actionType: ActionType;
  /** Primary CTA text, e.g. "Mark Done", "+1 glass" */
  ctaLabel: string;
  /** Short contextual line, e.g. "Only 2 glasses left!" */
  remainingCopy: string;
  urgencyType: UrgencyType;
  /** For increment: amount to add in one tap */
  suggestedIncrement?: number;
}

/**
 * Scores each pending habit and returns the single best next action.
 * Returns null when there are no pending habits.
 */
export function getNextBestAction(
  pending: HabitForNBA[]
): NextBestAction | null {
  if (pending.length === 0) return null;

  interface Scored {
    habit: HabitForNBA;
    score: number;
    urgencyType: UrgencyType;
  }

  const scored: Scored[] = pending.map((habit) => {
    let score = 0;
    let urgencyType: UrgencyType = "normal";

    const currentValue = habit.todayCheckIn?.valueCompleted ?? 0;
    const target = habit.targetValue ?? null;
    const remaining = target !== null ? target - currentValue : null;
    const pct = target !== null && target > 0 ? currentValue / target : 0;

    // ── 1. Active streak at risk — highest urgency ────────────────────────
    if (habit.streak.currentStreak > 0) {
      score += 120 + habit.streak.currentStreak * 3;
      urgencyType = "streak-risk";
    }

    // ── 2. Close to completion (≥ 60% done) ──────────────────────────────
    if (target !== null && pct >= 0.6) {
      score += Math.round(80 * pct);
      urgencyType = "nearly-done";
    } else if (target !== null && pct >= 0.3) {
      score += 35;
    }

    // ── 3. Difficulty — easier habits surface first for momentum ─────────
    const diffScore: Record<string, number> = { EASY: 30, MEDIUM: 15, HARD: 0 };
    score += diffScore[habit.difficulty] ?? 15;

    // ── 4. Smaller remaining amount = faster win ─────────────────────────
    if (remaining !== null) {
      score += Math.max(0, 25 - remaining);
    }

    // ── 5. Has reminder time set (user planned this) ──────────────────────
    if (habit.reminderTime) score += 8;

    return { habit, score, urgencyType };
  });

  scored.sort((a, b) => b.score - a.score);
  const { habit, urgencyType } = scored[0];

  // ── Build CTA copy ───────────────────────────────────────────────────────
  const target = habit.targetValue ?? null;
  const unit = (habit.targetUnit ?? "").trim();
  const currentValue = habit.todayCheckIn?.valueCompleted ?? 0;
  const remaining = target !== null ? target - currentValue : null;

  let ctaLabel: string;
  let remainingCopy: string;
  let actionType: ActionType;
  let suggestedIncrement: number | undefined;

  if (target !== null && remaining !== null) {
    // Numeric-progress habit
    const unitLabel = unit ? ` ${unit}` : "";
    const step = deriveStep(target, unit);
    suggestedIncrement = Math.min(step, remaining);

    if (remaining <= step) {
      ctaLabel = `+${remaining}${unitLabel}`;
      remainingCopy = `Just ${remaining}${unitLabel} left for your perfect day`;
    } else if (remaining <= target * 0.35) {
      ctaLabel = `+${suggestedIncrement}${unitLabel}`;
      remainingCopy = `${remaining}${unitLabel} left — you're almost there`;
    } else {
      ctaLabel = `+${suggestedIncrement}${unitLabel}`;
      remainingCopy = `${remaining}${unitLabel} remaining today`;
    }
    actionType = "increment";
  } else {
    // Binary habit
    ctaLabel = "Mark Done";
    remainingCopy =
      urgencyType === "streak-risk"
        ? `Keep your ${habit.streak.currentStreak}🔥 day streak alive`
        : habit.difficulty === "EASY"
        ? "Quick win — takes just a moment"
        : "Make it happen today";
    actionType = "quick-complete";
  }

  return {
    habit,
    actionType,
    ctaLabel,
    remainingCopy,
    urgencyType,
    suggestedIncrement,
  };
}

/** Derive a sensible tap-increment step from target + unit context. */
function deriveStep(target: number, unit: string): number {
  const u = unit.toLowerCase();
  // Common unit heuristics
  if (u.includes("glass") || u.includes("cup") || u.includes("glass")) return 1;
  if (u.includes("page")) return Math.max(1, Math.round(target / 8));
  if (u.includes("min")) return Math.max(5, Math.round(target / 6 / 5) * 5);
  if (u.includes("km") || u.includes("mile")) return 1;
  if (u.includes("rep") || u.includes("push") || u.includes("pull")) return 5;
  // Generic: ~1/8 of target, snapped to nice number
  const raw = target / 8;
  if (raw <= 1) return 1;
  if (raw <= 5) return Math.round(raw);
  return Math.round(raw / 5) * 5;
}
