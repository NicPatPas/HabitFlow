"use client";
import { useState } from "react";
import { Sparkles, Flame, ChevronRight, Loader2 } from "lucide-react";
import type { NextBestAction } from "@/lib/next-best-action";

interface NextBestActionCardProps {
  action: NextBestAction;
  /** Quick action: complete or increment — no modal needed */
  onQuickAction: (
    habitId: string,
    data: { status: string; valueCompleted?: number }
  ) => Promise<void>;
  /** Opens the full check-in modal */
  onOpenModal: () => void;
}

export function NextBestActionCard({
  action,
  onQuickAction,
  onOpenModal,
}: NextBestActionCardProps) {
  const [loading, setLoading] = useState(false);
  const { habit, ctaLabel, remainingCopy, urgencyType, actionType, suggestedIncrement } = action;

  async function handlePrimary() {
    if (loading) return;
    setLoading(true);
    try {
      if (actionType === "quick-complete") {
        await onQuickAction(habit.id, { status: "DONE" });
      } else if (actionType === "increment" && suggestedIncrement !== undefined) {
        const existing = habit.todayCheckIn?.valueCompleted ?? 0;
        const newValue = existing + suggestedIncrement;
        const target = habit.targetValue ?? 0;
        const status = newValue >= target ? "DONE" : "PARTIAL";
        await onQuickAction(habit.id, { status, valueCompleted: newValue });
      } else {
        onOpenModal();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl border relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 20% 60%, ${habit.color}12, transparent 55%), hsl(240 7% 10%)`,
        borderColor: `${habit.color}30`,
        boxShadow: `0 0 0 1px ${habit.color}18, 0 4px 32px ${habit.color}12`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${habit.color}, ${habit.color}40)`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${habit.color}20` }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: habit.color }} />
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: habit.color }}
            >
              Next Action
            </span>
          </div>

          {/* Urgency badge */}
          {urgencyType === "streak-risk" && (
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#f9731618", color: "#f97316" }}
            >
              <Flame className="h-3 w-3" />
              Streak at risk
            </div>
          )}
          {urgencyType === "nearly-done" && (
            <div
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#22c55e18", color: "#22c55e" }}
            >
              Almost there!
            </div>
          )}
        </div>

        {/* Habit info */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              backgroundColor: `${habit.color}18`,
              border: `1px solid ${habit.color}30`,
              boxShadow: `0 0 20px ${habit.color}18`,
            }}
          >
            {habit.emoji}
          </div>
          <div className="min-w-0">
            <h3
              className="font-bold text-base leading-tight"
              style={{ color: "hsl(0 0% 97%)" }}
            >
              {habit.name}
            </h3>
            <p
              className="text-sm mt-0.5 leading-snug"
              style={{ color: "hsl(240 4% 50%)" }}
            >
              {remainingCopy}
            </p>
          </div>
        </div>

        {/* Numeric progress bar (if applicable) */}
        {habit.targetValue !== null && (
          <ProgressBar
            current={habit.todayCheckIn?.valueCompleted ?? 0}
            target={habit.targetValue}
            color={habit.color}
          />
        )}

        {/* CTA row */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handlePrimary}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundColor: habit.color,
              color: "white",
              boxShadow: `0 4px 16px ${habit.color}35`,
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {ctaLabel}
                {actionType !== "open-modal" && (
                  <span style={{ opacity: 0.8 }}>✓</span>
                )}
              </>
            )}
          </button>

          <button
            onClick={onOpenModal}
            className="flex items-center gap-1 px-3 py-3 rounded-xl text-xs font-medium transition-all hover:brightness-125"
            style={{
              backgroundColor: "hsl(240 6% 14%)",
              color: "hsl(240 4% 50%)",
            }}
          >
            All options <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  target,
  color,
}: {
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "hsl(240 4% 42%)" }}>
          {current} / {target}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${color}18` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: pct > 0 ? `0 0 8px ${color}70` : "none",
          }}
        />
      </div>
    </div>
  );
}
