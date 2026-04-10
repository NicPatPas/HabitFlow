"use client";
import { Trophy, Star, Flame } from "lucide-react";
import { format } from "date-fns";
import type { PerfectDaySummary } from "@/lib/perfect-day";
import { useColors } from "@/contexts/theme-context";

interface PerfectDayCardProps {
  summary: PerfectDaySummary;
}

export function PerfectDayCard({ summary }: PerfectDayCardProps) {
  const c = useColors();
  const { history, streak, todayStatus } = summary;
  const isPerfectToday = todayStatus?.isPerfect ?? false;
  const pct = todayStatus?.completionPct ?? 0;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: isPerfectToday
          ? `radial-gradient(ellipse at 30% 40%, #4ade8012, transparent 55%), ${c.bgCard}`
          : c.bgCard,
        borderColor: isPerfectToday ? "#4ade8030" : c.border,
        boxShadow: isPerfectToday
          ? `0 0 0 1px #4ade8018, ${c.shadow}`
          : c.shadow,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{
          background: isPerfectToday
            ? "linear-gradient(90deg, #4ade80, #22c55e40)"
            : "linear-gradient(90deg, #6366f1, #6366f140)",
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: isPerfectToday ? "#4ade8020" : "#6366f115" }}
            >
              {isPerfectToday ? (
                <Trophy className="h-4 w-4" style={{ color: "#4ade80" }} />
              ) : (
                <Star className="h-4 w-4" style={{ color: "#6366f1" }} />
              )}
            </div>
            <h2 className="text-sm font-semibold" style={{ color: c.text }}>Perfect Day</h2>
          </div>
          <p className="text-xs" style={{ color: c.textMuted }}>
            {isPerfectToday
              ? "All habits done — flawless! 🎉"
              : `${todayStatus?.completed ?? 0} of ${todayStatus?.total ?? 0} habits done`}
          </p>
        </div>

        <ProgressRing pct={pct} isPerfect={isPerfectToday} c={c} />
      </div>

      {/* Streak row */}
      {streak > 0 && (
        <div
          className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "#f9731612", border: "1px solid #f9731618" }}
        >
          <Flame className="h-4 w-4 flex-shrink-0" style={{ color: "#f97316" }} />
          <div>
            <span className="text-sm font-bold" style={{ color: "#f97316" }}>{streak}</span>
            <span className="text-sm" style={{ color: c.textMuted }}>
              {" "}consecutive perfect {streak === 1 ? "day" : "days"}
            </span>
          </div>
          {streak >= 7 && (
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#f9731618", color: "#f97316" }}
            >
              {streak >= 30 ? "🏆 Legend" : streak >= 14 ? "🔥 On fire" : "⚡ On a roll"}
            </span>
          )}
        </div>
      )}

      {/* 14-day mini calendar */}
      <div className="mt-4">
        <div className="text-xs mb-2.5" style={{ color: c.textMuted }}>Last 14 days</div>
        <DayCalendar history={history} c={c} />
      </div>
    </div>
  );
}

function ProgressRing({ pct, isPerfect, c }: { pct: number; isPerfect: boolean; c: ReturnType<typeof useColors> }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = isPerfect ? "#4ade80" : "#6366f1";

  return (
    <div className="relative flex-shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke={c.border} strokeWidth="4.5" />
        <circle
          cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)",
            filter: isPerfect ? "drop-shadow(0 0 4px #4ade80)" : "none",
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: isPerfect ? "20px" : "13px", fontWeight: 700 }}
      >
        {isPerfect ? "✓" : <span style={{ color: c.text }}>{pct}%</span>}
      </div>
    </div>
  );
}

function DayCalendar({ history, c }: { history: PerfectDaySummary["history"]; c: ReturnType<typeof useColors> }) {
  const days = [...history].reverse();

  return (
    <div className="flex items-end gap-1.5" style={{ overflowX: "auto", paddingBottom: "2px" }}>
      {days.map((day) => {
        const label = format(new Date(day.date + "T12:00:00"), "d");
        const isToday = day.date === format(new Date(), "yyyy-MM-dd");

        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: "18px" }}>
            <div
              className="rounded-full"
              style={{ width: "12px", height: "28px", position: "relative", backgroundColor: c.bgSubtle, overflow: "hidden" }}
            >
              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${day.completionPct}%`,
                  backgroundColor: day.isPerfect ? "#4ade80" : day.completionPct > 0 ? "#6366f1" : "transparent",
                  transition: "height 600ms ease",
                  borderRadius: "4px",
                  boxShadow: day.isPerfect ? "0 0 6px #4ade8080" : "none",
                }}
              />
            </div>
            <span
              className="text-xs tabular-nums"
              style={{ color: isToday ? c.text : c.textMuted, fontWeight: isToday ? 700 : 400 }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
