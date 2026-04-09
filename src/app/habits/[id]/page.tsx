"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInModal } from "@/components/checkins/checkin-modal";
import { STATUS_CONFIG, DIFFICULTY_LABELS, FREQUENCY_LABELS } from "@/types";
import { calculateStreak } from "@/lib/streak";
import { getDayOfWeekStats } from "@/lib/analytics";
import { ArrowLeft, Flame, Trophy, BarChart2, Calendar, TrendingUp, Zap } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Habit, HabitCheckIn } from "@prisma/client";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(240 8% 10%)",
  border: "1px solid hsl(240 5% 18%)",
  borderRadius: "10px",
  fontSize: 12,
  color: "hsl(0 0% 90%)",
};

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [habit, setHabit] = useState<(Habit & { checkIns: HabitCheckIn[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);

  async function loadHabit() {
    const res = await fetch(`/api/habits/${id}`);
    if (!res.ok) { router.push("/habits"); return; }
    setHabit(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadHabit(); }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!habit) return null;

  const streak = calculateStreak(habit.checkIns, {
    frequencyType: habit.frequencyType as "DAILY" | "WEEKLY" | "CUSTOM",
    frequencyDays: habit.frequencyDays,
    targetValue: habit.targetValue,
    streakFreeze: habit.streakFreeze,
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCheckIn = habit.checkIns.find((ci) => ci.date === todayStr) ?? null;
  const dowStats = getDayOfWeekStats(habit.checkIns, habit.targetValue);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
    const ci = habit.checkIns.find((c) => c.date === date);
    return { date, status: ci?.status ?? null };
  });

  const totalDone = habit.checkIns.filter((ci) => ci.status === "DONE").length;
  const totalPartial = habit.checkIns.filter((ci) => ci.status === "PARTIAL").length;
  const completionRate = habit.checkIns.length > 0
    ? Math.round(((totalDone + totalPartial) / habit.checkIns.length) * 100)
    : 0;

  async function handleCheckIn(data: { status: string; valueCompleted?: number; notes?: string }) {
    await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: habit!.id, ...data }),
    });
    loadHabit();
  }

  const statCards = [
    { label: "Current Streak", value: streak.currentStreak, unit: "days", icon: <Flame className="h-4 w-4" style={{ color: "#f97316" }} />, accent: "#f97316" },
    { label: "Best Streak", value: streak.bestStreak, unit: "days", icon: <Trophy className="h-4 w-4" style={{ color: "#eab308" }} />, accent: "#eab308" },
    { label: "Completion", value: completionRate, unit: "%", icon: <TrendingUp className="h-4 w-4" style={{ color: "#22c55e" }} />, accent: "#22c55e" },
    { label: "Total Done", value: totalDone + totalPartial, unit: "times", icon: <Zap className="h-4 w-4" style={{ color: "#a855f7" }} />, accent: "#a855f7" },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3 pt-1">
        <button
          onClick={() => router.back()}
          className="mt-1 p-2 rounded-xl transition-all hover:brightness-110"
          style={{ backgroundColor: "hsl(240 8% 7%)", border: "1px solid hsl(240 5% 14%)" }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
        <div className="flex-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${habit.color}18`, border: `1.5px solid ${habit.color}35` }}>
              {habit.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "hsl(0 0% 95%)" }}>{habit.name}</h1>
              <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>{FREQUENCY_LABELS[habit.frequencyType]}</span>
                {habit.targetValue && <span>· {habit.targetValue} {habit.targetUnit}</span>}
                <span>· {DIFFICULTY_LABELS[habit.difficulty]}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCheckInOpen(true)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: habit.color }}
          >
            Check In
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map(({ label, value, unit, icon, accent }) => (
          <div key={label} className="rounded-2xl border p-5"
            style={{
              backgroundColor: "hsl(240 7% 9%)",
              borderColor: "hsl(240 4% 16%)",
              boxShadow: "0 2px 16px hsl(240 10% 3% / 0.5)",
            }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                {icon}
              </div>
              <span className="text-xs font-medium" style={{ color: "hsl(240 4% 42%)" }}>{label}</span>
            </div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(0 0% 97%)" }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: "hsl(240 4% 40%)" }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Day of week chart */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "hsl(240 7% 9%)", borderColor: "hsl(240 4% 16%)" }}>
        <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b" style={{ borderColor: "hsl(240 5% 12%)" }}>
          <BarChart2 className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>Success by Day of Week</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 14%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, "Rate"]} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                {dowStats.map((entry, i) => (
                  <Cell key={i} fill={entry.completionRate >= 70 ? habit.color : `${habit.color}50`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last 30 days heatmap */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "hsl(240 7% 9%)", borderColor: "hsl(240 4% 16%)" }}>
        <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b" style={{ borderColor: "hsl(240 5% 12%)" }}>
          <Calendar className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>Last 30 Days</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-1.5">
            {last30.map(({ date, status }) => {
              const cfg = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;
              return (
                <div
                  key={date}
                  title={`${format(parseISO(date), "MMM d")}: ${status ?? "no check-in"}`}
                  className="h-7 w-7 rounded-lg transition-all hover:opacity-80 cursor-default flex items-center justify-center"
                  style={{ backgroundColor: cfg ? `${cfg.color}25` : "hsl(240 6% 11%)", border: `1px solid ${cfg ? `${cfg.color}40` : "hsl(240 5% 16%)"}` }}
                >
                  {cfg && <span className="text-xs">{cfg.icon}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(240 6% 11%)" }} />
              No check-in
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "hsl(240 7% 9%)", borderColor: "hsl(240 4% 16%)" }}>
        <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "hsl(240 5% 12%)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>Recent Activity</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "hsl(240 5% 12%)" }}>
          {habit.checkIns.slice(0, 10).map((ci) => {
            const cfg = STATUS_CONFIG[ci.status];
            return (
              <div key={ci.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-base">{cfg.icon}</span>
                  <span className="text-sm" style={{ color: "hsl(0 0% 85%)" }}>
                    {format(parseISO(ci.date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {ci.valueCompleted != null && (
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {ci.valueCompleted}/{ci.targetValueSnapshot} {habit.targetUnit}
                    </span>
                  )}
                  {ci.notes && (
                    <span className="text-xs italic max-w-[120px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {ci.notes}
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
          {habit.checkIns.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "hsl(var(--muted-foreground))" }}>
              No check-ins yet.
            </p>
          )}
        </div>
      </div>

      {checkInOpen && (
        <CheckInModal
          habit={habit}
          existingCheckIn={todayCheckIn}
          open={checkInOpen}
          onClose={() => setCheckInOpen(false)}
          onSave={async (data) => { await handleCheckIn(data); }}
        />
      )}
    </div>
  );
}
