"use client";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInModal } from "@/components/checkins/checkin-modal";
import { STATUS_CONFIG } from "@/types";
import { format } from "date-fns";
import { CheckCircle2, Circle, Flame, Zap } from "lucide-react";
import { SparkBurst } from "@/components/animations/spark-burst";
import { ConfettiBurst } from "@/components/animations/confetti-burst";
import { useReward } from "@/hooks/use-reward";
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { getNextBestAction } from "@/lib/next-best-action";
import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

type HabitWithData = Habit & { streak: StreakResult; todayCheckIn: HabitCheckIn | null };

export default function TodayPage() {
  const [habits, setHabits] = useState<HabitWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHabit, setActiveHabit] = useState<HabitWithData | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const { reward, triggerReward, clearBurst, clearConfetti } = useReward();

  async function loadData() {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setHabits(json.habits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckIn(
    habitId: string,
    data: { status: string; valueCompleted?: number; notes?: string }
  ) {
    // Capture streak state BEFORE the API call for accurate tier detection
    const habitSnapshot = habits.find((h) => h.id === habitId);
    const currentStreak = habitSnapshot?.streak.currentStreak ?? 0;
    const bestStreak = habitSnapshot?.streak.bestStreak ?? 0;
    const color = habitSnapshot?.color ?? "#8b5cf6";

    // Fire immediately for instant haptic + sound feedback
    triggerReward({ status: data.status, currentStreak, bestStreak, color });

    await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, ...data }),
    });

    await loadData();

    // Show spark burst on the card after it lands in "Completed" section
    if (data.status === "DONE" || data.status === "PARTIAL") {
      setJustCompletedId(habitId);
      const timer = setTimeout(() => setJustCompletedId(null), 800);
      return () => clearTimeout(timer);
    }
  }

  const done = habits.filter(
    (h) => h.todayCheckIn?.status === "DONE" || h.todayCheckIn?.status === "PARTIAL"
  ).length;
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  const pending = habits.filter((h) => !h.todayCheckIn);
  const nextAction = pending.length > 0 ? getNextBestAction(pending) : null;
  const completed = habits.filter(
    (h) => h.todayCheckIn?.status === "DONE" || h.todayCheckIn?.status === "PARTIAL"
  );
  const other = habits.filter(
    (h) =>
      h.todayCheckIn &&
      h.todayCheckIn.status !== "DONE" &&
      h.todayCheckIn.status !== "PARTIAL"
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Page-level confetti (survives re-renders) */}
      {reward.confetti && (
        <ConfettiBurst
          colors={["#8b5cf6", "#6366f1", "#f97316", "#22c55e", reward.color]}
          onDone={clearConfetti}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "hsl(0 0% 95%)" }}>
          Today
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Progress hero */}
      {loading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <div
          className="rounded-2xl p-5 border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(262 60% 12%), hsl(240 40% 10%))",
            borderColor: "hsl(262 35% 18%)",
            boxShadow: "0 4px 32px hsl(262 60% 10% / 0.5)",
          }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(circle at 80% 50%, hsl(262 80% 65% / 0.4), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl font-bold tabular-nums"
                    style={{ color: "hsl(0 0% 97%)" }}
                  >
                    {done}
                  </span>
                  <span className="text-xl" style={{ color: "hsl(262 50% 65%)" }}>
                    / {habits.length}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: "hsl(262 35% 65%)" }}>
                  habits completed today
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: pct === 100 ? "#4ade80" : "hsl(262 80% 78%)" }}
                >
                  {pct}%
                </div>
                {pct === 100 && habits.length > 0 && (
                  <div className="text-xs font-medium" style={{ color: "#4ade80" }}>
                    Perfect day 🎉
                  </div>
                )}
                {pct > 0 && pct < 100 && (
                  <div className="text-xs" style={{ color: "hsl(262 40% 65%)" }}>
                    {pending.length} left
                  </div>
                )}
              </div>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "hsl(262 40% 20%)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background:
                    pct === 100
                      ? "#4ade80"
                      : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Next Best Action ──────────────────────────────────────────── */}
      {!loading && nextAction && (
        <NextBestActionCard
          action={nextAction}
          onQuickAction={async (habitId, d) => {
            await handleCheckIn(habitId, d);
          }}
          onOpenModal={() => {
            const h = habits.find((x) => x.id === nextAction.habit.id);
            if (h) setActiveHabit(h);
          }}
        />
      )}

      {/* Habits list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
                  Pending
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    color: "hsl(var(--muted-foreground))",
                    backgroundColor: "hsl(240 6% 11%)",
                  }}
                >
                  {pending.length} left
                </span>
              </div>
              <div className="space-y-3">
                {pending.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    onClick={() => setActiveHabit(habit)}
                    justCompleted={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Completed
                </h2>
                <span className="text-xs" style={{ color: "#4ade80" }}>
                  {completed.length} done ✓
                </span>
              </div>
              <div className="space-y-3">
                {completed.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    onClick={() => setActiveHabit(habit)}
                    justCompleted={justCompletedId === habit.id}
                    onBurstDone={
                      justCompletedId === habit.id
                        ? () => setJustCompletedId(null)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Skipped/Failed */}
          {other.length > 0 && (
            <div>
              <h2
                className="text-sm font-semibold mb-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Other
              </h2>
              <div className="space-y-3">
                {other.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    onClick={() => setActiveHabit(habit)}
                    justCompleted={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && habits.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(0 0% 95%)" }}>
            No habits to track
          </h3>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Add habits from the Habits page first.
          </p>
        </div>
      )}

      {activeHabit && (
        <CheckInModal
          habit={activeHabit}
          existingCheckIn={activeHabit.todayCheckIn}
          open={!!activeHabit}
          onClose={() => setActiveHabit(null)}
          onSave={async (data) => {
            await handleCheckIn(activeHabit.id, data);
          }}
        />
      )}
    </div>
  );
}

// ─── HabitRow ─────────────────────────────────────────────────────────────────

interface HabitRowProps {
  habit: HabitWithData;
  onClick: () => void;
  justCompleted: boolean;
  onBurstDone?: () => void;
}

function HabitRow({ habit, onClick, justCompleted, onBurstDone }: HabitRowProps) {
  const ci = habit.todayCheckIn;
  const statusCfg = ci ? STATUS_CONFIG[ci.status] : null;
  const isDone = ci?.status === "DONE" || ci?.status === "PARTIAL";

  const pctValue =
    habit.targetValue && ci?.valueCompleted != null
      ? Math.min(100, Math.round((ci.valueCompleted / habit.targetValue) * 100))
      : null;

  const streakColor =
    habit.streak.currentStreak >= 7
      ? "#f97316"
      : habit.streak.currentStreak > 0
      ? "#fb923c"
      : undefined;

  // Flame pulse animation style when just completed and streak > 0
  const flamePulse = justCompleted && habit.streak.currentStreak > 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: "hsl(240 7% 9%)",
        borderColor: justCompleted ? `${habit.color}50` : "hsl(240 4% 16%)",
        boxShadow: justCompleted
          ? `0 0 0 1px ${habit.color}20, 0 4px 24px ${habit.color}18`
          : "0 2px 12px hsl(240 10% 3% / 0.3)",
        position: "relative",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${habit.color}45`;
        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(240 7% 11%)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = justCompleted
          ? `${habit.color}50`
          : "hsl(240 4% 16%)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(240 7% 9%)";
      }}
    >
      {/* Spark burst overlay */}
      {justCompleted && (
        <SparkBurst color={habit.color} onDone={onBurstDone} />
      )}

      <div className="h-[2px]" style={{ backgroundColor: habit.color }} />
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0">
            {isDone ? (
              <CheckCircle2
                className="h-5 w-5"
                style={{
                  color: habit.color,
                  filter: justCompleted
                    ? `drop-shadow(0 0 6px ${habit.color})`
                    : "none",
                }}
              />
            ) : (
              <Circle
                className="h-5 w-5"
                style={{ color: "hsl(var(--muted-foreground))", opacity: 0.25 }}
              />
            )}
          </div>

          {/* Emoji */}
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              backgroundColor: `${habit.color}18`,
              border: `1px solid ${habit.color}28`,
            }}
          >
            {habit.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div
              className="font-semibold text-sm"
              style={{
                color: isDone ? "hsl(240 4% 40%)" : "hsl(0 0% 95%)",
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {habit.name}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {habit.targetValue && (
                <span className="text-xs" style={{ color: "hsl(240 4% 42%)" }}>
                  {ci?.valueCompleted != null ? `${ci.valueCompleted}/` : ""}
                  {habit.targetValue} {habit.targetUnit}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Flame
                  className="h-3 w-3"
                  style={{
                    color: streakColor ?? "hsl(var(--muted-foreground))",
                    opacity: habit.streak.currentStreak === 0 ? 0.25 : 1,
                    // CSS animation for flame pulse
                    animation: flamePulse ? "flamePulse 0.6s ease-out" : "none",
                    filter: flamePulse ? `drop-shadow(0 0 4px #f97316)` : "none",
                  }}
                />
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{
                    color: streakColor ?? "hsl(var(--muted-foreground))",
                    opacity: habit.streak.currentStreak === 0 ? 0.25 : 1,
                  }}
                >
                  {habit.streak.currentStreak}
                </span>
              </div>
            </div>

            {pctValue !== null && (
              <div
                className="mt-2 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: `${habit.color}18` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pctValue}%`,
                    backgroundColor: habit.color,
                    transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            )}
          </div>

          {/* Status / CTA */}
          <div className="flex-shrink-0">
            {statusCfg ? (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: statusCfg.color,
                  backgroundColor: `${statusCfg.color}18`,
                }}
              >
                {statusCfg.label}
              </span>
            ) : (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: `${habit.color}18`,
                  color: habit.color,
                  border: `1px solid ${habit.color}35`,
                }}
              >
                Check in →
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inject flame pulse keyframes once */}
      <style>{`
        @keyframes flamePulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 2px #f97316); }
          35%  { transform: scale(1.55); filter: drop-shadow(0 0 8px #f97316) drop-shadow(0 0 14px #f97316cc); }
          65%  { transform: scale(1.3);  filter: drop-shadow(0 0 6px #f97316); }
          100% { transform: scale(1);    filter: none; }
        }
      `}</style>
    </div>
  );
}
