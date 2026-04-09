"use client";
import { useState, useCallback } from "react";
import { hapticLight, hapticSuccess, hapticMilestone } from "@/lib/haptics";
import { playComplete, playMilestone } from "@/lib/sounds";

export type RewardTier = "none" | "normal" | "milestone" | "newbest";

const MILESTONE_STREAKS = new Set([7, 14, 30, 50, 100, 365]);

export interface RewardState {
  burst: boolean;
  confetti: boolean;
  tier: RewardTier;
  /** Accent color for the burst */
  color: string;
}

const INITIAL: RewardState = {
  burst: false,
  confetti: false,
  tier: "none",
  color: "#8b5cf6",
};

/**
 * Orchestrates completion reward animations.
 *
 * Usage:
 * ```ts
 * const { reward, triggerReward, clearBurst, clearConfetti } = useReward();
 *
 * // On save:
 * triggerReward({ status: "DONE", currentStreak: 5, bestStreak: 5, color: "#f97316" });
 * ```
 */
export function useReward() {
  const [reward, setReward] = useState<RewardState>(INITIAL);

  const triggerReward = useCallback(
    (opts: {
      status: string;
      currentStreak: number;
      bestStreak: number;
      color: string;
    }) => {
      const { status, currentStreak, bestStreak, color } = opts;

      const isDone = status === "DONE" || status === "PARTIAL";
      if (!isDone) return;

      // Optimistic new streak (will be confirmed after reload)
      const newStreak = currentStreak + 1;
      const isNewBest = newStreak > bestStreak;
      const isMilestone = MILESTONE_STREAKS.has(newStreak);

      const tier: RewardTier =
        isNewBest ? "newbest" :
        isMilestone ? "milestone" :
        "normal";

      // Haptics — fire immediately (before re-render)
      if (tier === "newbest" || tier === "milestone") hapticMilestone();
      else if (newStreak > 1) hapticSuccess();
      else hapticLight();

      // Sounds
      if (tier === "newbest" || tier === "milestone") playMilestone();
      else playComplete();

      setReward({
        burst: true,
        confetti: tier !== "normal",
        tier,
        color,
      });
    },
    []
  );

  const clearBurst = useCallback(() => {
    setReward((prev) => ({ ...prev, burst: false }));
  }, []);

  const clearConfetti = useCallback(() => {
    setReward((prev) => ({ ...prev, confetti: false }));
  }, []);

  return { reward, triggerReward, clearBurst, clearConfetti };
}
