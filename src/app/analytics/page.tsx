"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame, Target, Activity, BarChart3, Calendar } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { DayOfWeekStats, WeeklyChartPoint, DailyChartPoint, HeatmapCell } from "@/lib/analytics";

type AnalyticsData = {
  globalStreak: {
    totalActiveStreaks: number;
    longestCurrentStreak: number;
    longestEverStreak: number;
    totalHabitsOnStreak: number;
  };
  weeklyChart: WeeklyChartPoint[];
  dailyChart: DailyChartPoint[];
  heatmap: HeatmapCell[];
  dowStats: DayOfWeekStats[];
  avgPerDay: number;
  bestDay: string;
  overallCompletionRate: number;
  totalHabits: number;
};

const HEATMAP_COLORS = [
  "hsl(240 6% 13%)",
  "#1e3a2f",
  "#166534",
  "#16a34a",
  "#4ade80",
];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(240 8% 10%)",
  border: "1px solid hsl(240 5% 18%)",
  borderRadius: "10px",
  fontSize: 12,
  color: "hsl(0 0% 90%)",
};

const TABS = ["weekly", "daily", "dow", "heatmap"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = { weekly: "Weekly", daily: "30 Days", dow: "By Day", heatmap: "Heatmap" };

function StatCard({ icon, label, value, accent, sub }: { icon: React.ReactNode; label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-5"
      style={{
        backgroundColor: "hsl(240 7% 9%)",
        borderColor: "hsl(240 4% 16%)",
        boxShadow: "0 2px 16px hsl(240 10% 3% / 0.5)",
      }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}15` }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "hsl(240 4% 36%)" }}>{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(0 0% 99%)" }}>{value}</div>
      {sub && <p className="text-xs mt-1" style={{ color: "hsl(240 4% 30%)" }}>{sub}</p>}
    </div>
  );
}

function ChartCard({ title, icon, subtitle, children }: { title: string; icon: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: "hsl(240 7% 9%)",
        borderColor: "hsl(240 4% 16%)",
        boxShadow: "0 2px 16px hsl(240 10% 3% / 0.4)",
      }}>
      <div className="px-6 pt-5 pb-4 flex items-center gap-2.5 border-b" style={{ borderColor: "hsl(240 4% 13%)" }}>
        <span style={{ color: "hsl(240 4% 40%)" }}>{icon}</span>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 92%)" }}>{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "hsl(240 4% 34%)" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("weekly");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "hsl(0 0% 95%)" }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your habit performance over time
        </p>
      </div>

      {/* Summary stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp className="h-4 w-4" style={{ color: "#22c55e" }} />} label="Completion Rate" value={`${data?.overallCompletionRate ?? 0}%`} accent="#22c55e" sub="all time" />
          <StatCard icon={<Flame className="h-4 w-4" style={{ color: "#f97316" }} />} label="Longest Streak" value={`${data?.globalStreak.longestEverStreak ?? 0}d`} accent="#f97316" sub="personal best" />
          <StatCard icon={<Target className="h-4 w-4" style={{ color: "#3b82f6" }} />} label="Avg / Day" value={String(data?.avgPerDay ?? 0)} accent="#3b82f6" sub="habits completed" />
          <StatCard icon={<Activity className="h-4 w-4" style={{ color: "#a855f7" }} />} label="Best Day" value={data?.bestDay ?? "—"} accent="#a855f7" sub="most productive" />
        </div>
      )}

      {/* Streak summary banner */}
      {!loading && data && (
        <div className="rounded-2xl border p-5"
          style={{
            background: "linear-gradient(135deg, hsl(25 70% 9%), hsl(40 50% 7%))",
            borderColor: "hsl(25 35% 16%)",
            boxShadow: "0 2px 20px hsl(25 60% 8% / 0.5)",
          }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4" style={{ color: "#f97316" }} />
            <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 92%)" }}>Streak Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "On Streak", value: data.globalStreak.totalHabitsOnStreak },
              { label: "Total Days", value: data.globalStreak.totalActiveStreaks },
              { label: "Current Best", value: data.globalStreak.longestCurrentStreak },
              { label: "All-Time Record", value: data.globalStreak.longestEverStreak },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-3xl font-bold tabular-nums" style={{ color: "#f97316" }}>{value}</div>
                <div className="text-xs mt-1" style={{ color: "hsl(25 15% 38%)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              backgroundColor: tab === t ? "hsl(262 80% 65% / 0.15)" : "transparent",
              color: tab === t ? "hsl(262 80% 72%)" : "hsl(var(--muted-foreground))",
              boxShadow: tab === t ? "inset 0 0 0 1px hsl(262 80% 65% / 0.3)" : "none",
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Chart panels */}
      {tab === "weekly" && (
        <ChartCard title="Weekly Completion Rate" subtitle="Completion % over time" icon={<BarChart3 className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.weeklyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 14%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Completion"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
                <Line type="monotone" dataKey="completionRate" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      )}

      {tab === "daily" && (
        <ChartCard title="Daily Completions" subtitle="Last 30 days" icon={<BarChart3 className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.dailyChart.slice(-30)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 14%)" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 10, fill: "hsl(240 4% 52%)" }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="completed" fill="#6366f1" radius={[3, 3, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      )}

      {tab === "dow" && (
        <ChartCard title="By Day of Week" subtitle="Which days you perform best" icon={<Activity className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-64" /> : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data?.dowStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 14%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(240 4% 52%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 4% 52%)" }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, "Rate"]} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                    {(data?.dowStats ?? []).map((entry, i) => (
                      <Cell key={i}
                        fill={entry.completionRate >= 70 ? "#8b5cf6" : entry.completionRate >= 50 ? "#7c3aed" : "#4c1d95"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {data?.bestDay && (
                <p className="text-sm text-center mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Your best day is <strong style={{ color: "hsl(0 0% 90%)" }}>{data.bestDay}</strong> 🎯
                </p>
              )}
            </>
          )}
        </ChartCard>
      )}

      {tab === "heatmap" && (
        <ChartCard title="Activity Heatmap" subtitle="Past 365 days" icon={<Calendar className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-32" /> : (
            <>
              <div className="flex flex-wrap gap-1">
                {(data?.heatmap ?? []).map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.completionRate}%`}
                    className="h-3 w-3 rounded-sm transition-opacity hover:opacity-70 cursor-default"
                    style={{ backgroundColor: HEATMAP_COLORS[cell.count] }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>Less</span>
                {HEATMAP_COLORS.map((c, i) => (
                  <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
                <span>More</span>
              </div>
            </>
          )}
        </ChartCard>
      )}
    </div>
  );
}
