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
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { PerfectDayCard } from "@/components/dashboard/perfect-day-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getNextBestAction } from "@/lib/next-best-action";
import { computePerfectDays } from "@/lib/perfect-day";
import { computeAchievements } from "@/lib/achievements";
import { useColors } from "@/contexts/theme-context";
import type { HabitFormData } from "@/types";
import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";
import type { HabitTemplate } from "@/lib/habit-templates";

type HabitWithData = Habit & { streak: StreakResult; todayCheckIn: HabitCheckIn | null; checkIns: HabitCheckIn[] };

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent, c,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: c.bgCard, borderColor: c.border, boxShadow: c.shadow }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent ?? "#6366f1"}15` }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: c.textDim }}>{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: c.text }}>{value}</div>
      {sub && <p className="text-xs mt-1" style={{ color: c.textDimmer }}>{sub}</p>}
    </div>
  );
}

// ─── Streak Chip ─────────────────────────────────────────────────────────────

function StreakChip({ habit, c }: { habit: HabitWithData; c: ReturnType<typeof useColors> }) {
  const streakColor =
    habit.streak.currentStreak >= 30 ? "#f59e0b" :
    habit.streak.currentStreak >= 7  ? "#f97316" : "#fb923c";

  return (
    <Link href={`/habits/${habit.id}`}>
      <div
        className="flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer"
        style={{
          backgroundColor: c.bgCard,
          borderColor: c.border,
          transition: "transform 120ms ease, filter 120ms ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
        onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        <span className="text-base">{habit.emoji}</span>
        <div>
          <div className="text-xs font-medium" style={{ color: c.text2 }}>{habit.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="h-3 w-3" style={{ color: streakColor }} />
            <span className="text-sm font-bold tabular-nums" style={{ color: streakColor }}>
              {habit.streak.currentStreak}
            </span>
            <span className="text-xs" style={{ color: c.textDim }}>d</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Active Streaks ───────────────────────────────────────────────────────────

const VISIBLE_STREAK_COUNT = 4;

function ActiveStreaks({ habits, c }: { habits: HabitWithData[]; c: ReturnType<typeof useColors> }) {
  const [modalOpen, setModalOpen] = useState(false);

  const streakHabits = habits
    .filter((h) => h.streak.currentStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak);

  const visible = streakHabits.slice(0, VISIBLE_STREAK_COUNT);
  const hidden  = streakHabits.slice(VISIBLE_STREAK_COUNT);

  if (streakHabits.length === 0) return null;

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
          <h2 className="text-sm font-semibold" style={{ color: c.text }}>Active Streaks</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bgSubtle, color: c.textMuted }}>
            {streakHabits.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {visible.map((h) => <StreakChip key={h.id} habit={h} c={c} />)}
          {hidden.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border text-xs font-semibold transition-all hover:brightness-125 active:scale-95"
              style={{ borderColor: c.borderInput, backgroundColor: c.bgCard, color: c.textMuted }}
            >
              <Zap className="h-3 w-3" />+{hidden.length} more
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setModalOpen(false)}
          />
          <div
            className="relative w-full z-10 rounded-t-3xl border-t border-x"
            style={{
              backgroundColor: c.bgCard,
              borderColor: c.border,
              boxShadow: "0 -24px 64px hsl(240 10% 2% / 0.85)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: c.border }} />
            </div>
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: c.borderSubtle }}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
                <h3 className="text-sm font-semibold" style={{ color: c.text }}>All Active Streaks</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bgSubtle, color: c.textMuted }}>
                  {streakHabits.length}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: c.bgSubtle, color: c.textMuted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 space-y-2">
              {streakHabits.map((h) => {
                const streakColor = h.streak.currentStreak >= 30 ? "#f59e0b" : h.streak.currentStreak >= 7 ? "#f97316" : "#fb923c";
                return (
                  <Link key={h.id} href={`/habits/${h.id}`} onClick={() => setModalOpen(false)}>
                    <div
                      className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:brightness-105"
                      style={{ backgroundColor: c.bgCard, borderColor: c.border }}
                    >
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${h.color}18`, border: `1px solid ${h.color}28` }}
                      >
                        {h.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: c.text }}>{h.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: c.textMuted }}>
                          {h.streak.bestStreak > h.streak.currentStreak ? `Best: ${h.streak.bestStreak} days` : "Personal best!"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Flame className="h-4 w-4" style={{ color: streakColor }} />
                        <span className="text-lg font-bold tabular-nums" style={{ color: streakColor }}>{h.streak.currentStreak}</span>
                        <span className="text-xs" style={{ color: c.textMuted }}>d</span>
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
  const c = useColors();
  const [data, setData] = useState<{
    habits: HabitWithData[];
    todayProgress: { completed: number; total: number; percentage: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInHabit, setCheckInHabit] = useState<HabitWithData | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { reward, triggerReward, clearBurst, clearConfetti } = useReward();

  async function loadData() {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    setLoading(false);
    // Show onboarding for first-time users with no habits
    if ((json.habits ?? []).length === 0) {
      const seen = localStorage.getItem("hf-onboarding-seen");
      if (!seen) setShowOnboarding(true);
    }
  }

  useEffect(() => { loadData(); }, []);

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

  async function handleCheckIn(habitId: string, d: { status: string; valueCompleted?: number; notes?: string }) {
    const snap = data?.habits.find((h) => h.id === habitId);
    triggerReward({ status: d.status, currentStreak: snap?.streak.currentStreak ?? 0, bestStreak: snap?.streak.bestStreak ?? 0, color: snap?.color ?? "#8b5cf6" });
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

  async function handleOnboardingComplete(templates: HabitTemplate[]) {
    for (const t of templates) {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          emoji: t.emoji,
          color: t.color,
          frequencyType: t.frequencyType,
          frequencyDays: t.frequencyDays,
          targetValue: t.targetValue,
          targetUnit: t.targetUnit,
          difficulty: t.difficulty,
          reminderTime: "",
          streakFreeze: false,
        }),
      });
    }
    localStorage.setItem("hf-onboarding-seen", "1");
    setShowOnboarding(false);
    loadData();
  }

  function dismissOnboarding() {
    localStorage.setItem("hf-onboarding-seen", "1");
    setShowOnboarding(false);
  }

  const pct = data?.todayProgress.percentage ?? 0;
  const pendingHabits   = data?.habits.filter((h) => !h.todayCheckIn) ?? [];
  const completedHabits = data?.habits.filter((h) => h.todayCheckIn?.status === "DONE" || h.todayCheckIn?.status === "PARTIAL") ?? [];
  const maxCurrent = Math.max(0, ...(data?.habits.map((h) => h.streak.currentStreak) ?? [0]));
  const maxBest    = Math.max(0, ...(data?.habits.map((h) => h.streak.bestStreak)    ?? [0]));

  const nextAction = data && pendingHabits.length > 0 ? getNextBestAction(pendingHabits) : null;
  const perfectDaySummary = data ? computePerfectDays(data.habits) : null;

  // Compute achievements client-side
  const achievements = data
    ? computeAchievements(data.habits.map((h) => ({
        checkIns: h.checkIns,
        frequencyType: h.frequencyType,
        frequencyDays: h.frequencyDays,
        targetValue: h.targetValue,
        streakFreeze: h.streakFreeze,
        createdAt: h.createdAt,
        id: h.id,
      })))
    : [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={dismissOnboarding} />
      )}

      {/* Page-level confetti */}
      {reward.confetti && (
        <ConfettiBurst colors={["#8b5cf6", "#6366f1", "#f97316", "#22c55e", reward.color]} onDone={clearConfetti} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: c.text }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: c.textMuted }}>{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/habits">
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all hover:brightness-110"
              style={{ borderColor: c.borderInput, backgroundColor: c.bgCard, color: c.textMuted }}
            >
              <Plus className="h-3.5 w-3.5" /> Habit
            </button>
          </Link>
          <Link href="/today">
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}
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
            background: "linear-gradient(135deg, hsl(262 60% 12%), hsl(240 40% 10%))",
            borderColor: "hsl(262 35% 18%)",
            boxShadow: "0 4px 32px hsl(262 60% 10% / 0.5)",
          }}
        >
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 50%, hsl(262 80% 65% / 0.4), transparent 60%)" }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums" style={{ color: "hsl(0 0% 97%)" }}>
                  {data?.todayProgress.completed}
                </span>
                <span className="text-xl" style={{ color: "hsl(262 40% 55%)" }}>/ {data?.todayProgress.total}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: "hsl(262 35% 65%)" }}>habits done today</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold tabular-nums" style={{ color: pct === 100 ? "#4ade80" : "hsl(262 80% 78%)" }}>{pct}%</div>
              {pct === 100 && <div className="text-xs font-medium mt-0.5" style={{ color: "#4ade80" }}>Perfect day 🎉</div>}
              {pct > 0 && pct < 100 && <div className="text-xs mt-0.5" style={{ color: "hsl(262 35% 60%)" }}>{pendingHabits.length} left</div>}
            </div>
          </div>
          <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(262 40% 18%)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#4ade80" : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                boxShadow: pct === 100 ? "0 0 8px #4ade8080" : "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Next Best Action */}
      {loading ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : nextAction ? (
        <NextBestActionCard
          action={nextAction}
          onQuickAction={async (habitId, d) => { await handleCheckIn(habitId, d); }}
          onOpenModal={() => { const h = data?.habits.find((x) => x.id === nextAction.habit.id); if (h) setCheckInHabit(h); }}
        />
      ) : null}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Flame className="h-4 w-4" style={{ color: "#f97316" }} />} label="Best Active" value={maxCurrent} sub="day streak" accent="#f97316" c={c} />
          <StatCard icon={<TrendingUp className="h-4 w-4" style={{ color: "#22c55e" }} />} label="On Streak" value={data?.habits.filter((h) => h.streak.currentStreak > 0).length ?? 0} sub={`of ${data?.habits.length ?? 0} habits`} accent="#22c55e" c={c} />
          <StatCard icon={<Award className="h-4 w-4" style={{ color: "#a855f7" }} />} label="All-time Best" value={maxBest} sub="day streak" accent="#a855f7" c={c} />
          <StatCard icon={<Target className="h-4 w-4" style={{ color: "#3b82f6" }} />} label="Total Habits" value={data?.habits.length ?? 0} sub="being tracked" accent="#3b82f6" c={c} />
        </div>
      )}

      {/* Active streaks */}
      {!loading && data && <ActiveStreaks habits={data.habits} c={c} />}

      {/* Pending today */}
      {!loading && pendingHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: c.text }}>Pending Today</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: c.textMuted, backgroundColor: c.bgSubtle }}>
              {pendingHabits.length} left
            </span>
          </div>
          <div className="grid gap-4">
            {pendingHabits.map((h) => (
              <HabitCard
                key={h.id} habit={h} streak={h.streak} todayCheckIn={h.todayCheckIn}
                onDelete={handleDelete} onUpdate={handleUpdate}
                onCheckIn={() => setCheckInHabit(h)} showCheckIn justCompleted={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed today */}
      {!loading && completedHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: c.textMuted }}>Completed Today</h2>
            <span className="text-xs" style={{ color: "#4ade80" }}>{completedHabits.length} done ✓</span>
          </div>
          <div className="grid gap-4">
            {completedHabits.map((h) => (
              <HabitCard
                key={h.id} habit={h} streak={h.streak} todayCheckIn={h.todayCheckIn}
                onDelete={handleDelete} onUpdate={handleUpdate}
                justCompleted={justCompletedId === h.id}
                onBurstDone={justCompletedId === h.id ? () => setJustCompletedId(null) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {!loading && achievements.length > 0 && (
        <AchievementsCard achievements={achievements} />
      )}

      {/* Perfect Day */}
      {!loading && perfectDaySummary && data && data.habits.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <PerfectDayCard summary={perfectDaySummary} />
        </div>
      )}

      {/* Perfect day banner */}
      {!loading && data && pct === 100 && data.habits.length > 0 && (
        <div
          className="rounded-2xl border p-4 flex items-center gap-3"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, #4ade8010, transparent 55%), ${c.bgCard}`,
            borderColor: "#4ade8025",
          }}
        >
          <div className="text-2xl">🏆</div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#4ade80" }}>Perfect day achieved!</div>
            <div className="text-xs mt-0.5" style={{ color: c.textMuted }}>
              All {data.habits.length} habits completed — incredible.
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && (data?.habits.length ?? 0) === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: c.text }}>No habits yet</h3>
          <p className="text-sm mb-6" style={{ color: c.textMuted }}>Start building your first habit.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}
            >
              Get started with templates
            </button>
          </div>
        </div>
      )}

      {checkInHabit && (
        <CheckInModal
          habit={checkInHabit}
          existingCheckIn={checkInHabit.todayCheckIn}
          open={!!checkInHabit}
          onClose={() => setCheckInHabit(null)}
          onSave={async (d) => { await handleCheckIn(checkInHabit.id, d); }}
        />
      )}
    </div>
  );
}
