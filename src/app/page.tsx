"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitCard } from "@/components/habits/habit-card";
import { CheckInModal } from "@/components/checkins/checkin-modal";
import { Flame, TrendingUp, Target, Award, ChevronRight, Zap, Plus, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ConfettiBurst } from "@/components/animations/confetti-burst";
import { useReward } from "@/hooks/use-reward";
import type { HabitFormData } from "@/types";
import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

type HabitWithData = Habit & { streak: StreakResult; todayCheckIn: HabitCheckIn | null; checkIns: HabitCheckIn[] };

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "hsl(240 7% 9%)",
        borderColor: "hsl(240 4% 16%)",
        boxShadow: "0 2px 16px hsl(240 10% 3% / 0.5)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent ?? "#6366f1"}15` }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(0 0% 97%)" }}>
        {value}
      </div>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "hsl(240 4% 45%)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Streak Chip ─────────────────────────────────────────────────────────────

function StreakChip({ habit }: { habit: HabitWithData }) {
  const streakColor =
    habit.streak.currentStreak >= 30
      ? "#f59e0b"
      : habit.streak.currentStreak >= 7
      ? "#f97316"
      : "#fb923c";

  return (
    <Link href={`/habits/${habit.id}`}>
      <div
        className="flex items-center gap-2.5 rounded-xl border px-4 py-3 transition-all hover:brightness-110 cursor-pointer"
        style={{
          backgroundColor: "hsl(240 7% 10%)",
          borderColor: "hsl(240 4% 17%)",
          boxShadow: "0 1px 8px hsl(240 10% 3% / 0.3)",
        }}
      >
        <span className="text-base">{habit.emoji}</span>
        <div>
          <div className="text-xs font-medium" style={{ color: "hsl(0 0% 90%)" }}>
            {habit.name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="h-3 w-3" style={{ color: streakColor }} />
            <span className="text-xs font-bold" style={{ color: streakColor }}>
              {habit.streak.currentStreak}
            </span>
            <span className="text-xs" style={{ color: "hsl(240 4% 45%)" }}>
              days
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Active Streaks (with overflow modal) ────────────────────────────────────

const VISIBLE_STREAK_COUNT = 4;

function ActiveStreaks({ habits }: { habits: HabitWithData[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const streakHabits = habits
    .filter((h) => h.streak.currentStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak);

  const visible = streakHabits.slice(0, VISIBLE_STREAK_COUNT);
  const hidden = streakHabits.slice(VISIBLE_STREAK_COUNT);

  if (streakHabits.length === 0) return null;

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
            Active Streaks
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "hsl(240 6% 12%)", color: "hsl(240 4% 50%)" }}
          >
            {streakHabits.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {visible.map((h) => (
            <StreakChip key={h.id} habit={h} />
          ))}
          {hidden.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border text-xs font-semibold transition-all hover:brightness-125 active:scale-95"
              style={{
                borderColor: "hsl(240 4% 18%)",
                backgroundColor: "hsl(240 7% 10%)",
                color: "hsl(240 4% 55%)",
              }}
            >
              <Zap className="h-3 w-3" />+{hidden.length} more
            </button>
          )}
        </div>
      </div>

      {/* Overflow modal / bottom sheet */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ paddingBottom: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setModalOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full z-10 rounded-t-3xl border-t border-x"
            style={{
              backgroundColor: "hsl(240 8% 9%)",
              borderColor: "hsl(240 5% 18%)",
              boxShadow: "0 -24px 64px hsl(240 10% 2% / 0.85)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "hsl(240 5% 22%)" }} />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "hsl(240 5% 14%)" }}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
                <h3 className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
                  All Active Streaks
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "hsl(240 6% 14%)", color: "hsl(240 4% 50%)" }}
                >
                  {streakHabits.length}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg transition-all hover:brightness-125"
                style={{ backgroundColor: "hsl(240 6% 14%)" }}
              >
                <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-4 py-4 space-y-2">
              {streakHabits.map((h) => {
                const streakColor =
                  h.streak.currentStreak >= 30
                    ? "#f59e0b"
                    : h.streak.currentStreak >= 7
                    ? "#f97316"
                    : "#fb923c";
                return (
                  <Link
                    key={h.id}
                    href={`/habits/${h.id}`}
                    onClick={() => setModalOpen(false)}
                  >
                    <div
                      className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:brightness-110"
                      style={{
                        backgroundColor: "hsl(240 7% 11%)",
                        borderColor: "hsl(240 4% 16%)",
                      }}
                    >
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          backgroundColor: `${h.color}18`,
                          border: `1px solid ${h.color}28`,
                        }}
                      >
                        {h.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold truncate"
                          style={{ color: "hsl(0 0% 92%)" }}
                        >
                          {h.name}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "hsl(240 4% 45%)" }}
                        >
                          {h.streak.bestStreak > h.streak.currentStreak
                            ? `Best: ${h.streak.bestStreak} days`
                            : "Personal best!"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Flame className="h-4 w-4" style={{ color: streakColor }} />
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: streakColor }}
                        >
                          {h.streak.currentStreak}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(240 4% 45%)" }}>
                          d
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<{
    habits: HabitWithData[];
    todayProgress: { completed: number; total: number; percentage: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInHabit, setCheckInHabit] = useState<HabitWithData | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const { reward, triggerReward, clearBurst, clearConfetti } = useReward();

  async function loadData() {
    const res = await fetch("/api/dashboard");
    setData(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    loadData();
  }
  async function handleUpdate(id: string, formData: HabitFormData) {
    await fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    loadData();
  }
  async function handleCheckIn(
    habitId: string,
    d: { status: string; valueCompleted?: number; notes?: string }
  ) {
    const habitSnapshot = data?.habits.find((h) => h.id === habitId);
    const currentStreak = habitSnapshot?.streak.currentStreak ?? 0;
    const bestStreak = habitSnapshot?.streak.bestStreak ?? 0;
    const color = habitSnapshot?.color ?? "#8b5cf6";

    triggerReward({ status: d.status, currentStreak, bestStreak, color });

    await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, ...d }),
    });

    await loadData();

    if (d.status === "DONE" || d.status === "PARTIAL") {
      setJustCompletedId(habitId);
      setTimeout(() => setJustCompletedId(null), 800);
    }
  }

  const pct = data?.todayProgress.percentage ?? 0;
  const pendingHabits = data?.habits.filter((h) => !h.todayCheckIn) ?? [];
  const completedHabits =
    data?.habits.filter(
      (h) => h.todayCheckIn?.status === "DONE" || h.todayCheckIn?.status === "PARTIAL"
    ) ?? [];
  const maxCurrent = Math.max(
    0,
    ...(data?.habits.map((h) => h.streak.currentStreak) ?? [0])
  );
  const maxBest = Math.max(
    0,
    ...(data?.habits.map((h) => h.streak.bestStreak) ?? [0])
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Page-level confetti */}
      {reward.confetti && (
        <ConfettiBurst
          colors={["#8b5cf6", "#6366f1", "#f97316", "#22c55e", reward.color]}
          onDone={clearConfetti}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(0 0% 95%)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(240 4% 45%)" }}>
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/habits">
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all hover:brightness-110"
              style={{
                borderColor: "hsl(240 4% 16%)",
                backgroundColor: "hsl(240 7% 9%)",
                color: "hsl(240 4% 50%)",
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Habit
            </button>
          </Link>
          <Link href="/today">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "white",
              }}
            >
              Today&apos;s Check-in <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Today's progress hero */}
      {loading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <div
          className="rounded-2xl p-6 relative overflow-hidden border"
          style={{
            background:
              "linear-gradient(135deg, hsl(262 60% 12%), hsl(240 40% 10%))",
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
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: "hsl(0 0% 97%)" }}
                >
                  {data?.todayProgress.completed}
                </span>
                <span className="text-xl" style={{ color: "hsl(262 50% 65%)" }}>
                  / {data?.todayProgress.total}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: "hsl(262 35% 65%)" }}>
                habits done today
              </p>
            </div>
            <div className="text-right">
              <div
                className="text-4xl font-bold tabular-nums"
                style={{ color: pct === 100 ? "#4ade80" : "hsl(262 80% 78%)" }}
              >
                {pct}%
              </div>
              {pct === 100 && (
                <div
                  className="text-xs font-medium mt-0.5"
                  style={{ color: "#4ade80" }}
                >
                  Perfect day 🎉
                </div>
              )}
              {pct > 0 && pct < 100 && (
                <div className="text-xs mt-0.5" style={{ color: "hsl(262 35% 60%)" }}>
                  {pendingHabits.length} left
                </div>
              )}
            </div>
          </div>
          <div
            className="mt-5 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(262 40% 18%)" }}
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
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Flame className="h-4 w-4" style={{ color: "#f97316" }} />}
            label="Best Active"
            value={maxCurrent}
            sub="day streak"
            accent="#f97316"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" style={{ color: "#22c55e" }} />}
            label="On Streak"
            value={data?.habits.filter((h) => h.streak.currentStreak > 0).length ?? 0}
            sub={`of ${data?.habits.length ?? 0} habits`}
            accent="#22c55e"
          />
          <StatCard
            icon={<Award className="h-4 w-4" style={{ color: "#a855f7" }} />}
            label="All-time Best"
            value={maxBest}
            sub="day streak"
            accent="#a855f7"
          />
          <StatCard
            icon={<Target className="h-4 w-4" style={{ color: "#3b82f6" }} />}
            label="Total Habits"
            value={data?.habits.length ?? 0}
            sub="being tracked"
            accent="#3b82f6"
          />
        </div>
      )}

      {/* Active streaks */}
      {!loading && data && <ActiveStreaks habits={data.habits} />}

      {/* Pending today */}
      {!loading && pendingHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
              Pending Today
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: "hsl(240 4% 50%)",
                backgroundColor: "hsl(240 6% 12%)",
              }}
            >
              {pendingHabits.length} left
            </span>
          </div>
          <div className="grid gap-4">
            {pendingHabits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                streak={h.streak}
                todayCheckIn={h.todayCheckIn}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onCheckIn={() => setCheckInHabit(h)}
                showCheckIn
                justCompleted={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed today */}
      {!loading && completedHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold"
              style={{ color: "hsl(240 4% 45%)" }}
            >
              Completed Today
            </h2>
            <span className="text-xs" style={{ color: "#4ade80" }}>
              {completedHabits.length} done ✓
            </span>
          </div>
          <div className="grid gap-4">
            {completedHabits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                streak={h.streak}
                todayCheckIn={h.todayCheckIn}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                justCompleted={justCompletedId === h.id}
                onBurstDone={
                  justCompletedId === h.id ? () => setJustCompletedId(null) : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && (data?.habits.length ?? 0) === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌱</div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "hsl(0 0% 95%)" }}
          >
            No habits yet
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: "hsl(240 4% 45%)" }}
          >
            Start building your first habit.
          </p>
          <Link href="/habits">
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "white",
              }}
            >
              Create your first habit
            </button>
          </Link>
        </div>
      )}

      {checkInHabit && (
        <CheckInModal
          habit={checkInHabit}
          existingCheckIn={checkInHabit.todayCheckIn}
          open={!!checkInHabit}
          onClose={() => setCheckInHabit(null)}
          onSave={async (d) => {
            await handleCheckIn(checkInHabit.id, d);
          }}
        />
      )}
    </div>
  );
}
