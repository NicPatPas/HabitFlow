"use client";
import { useState } from "react";
import { Trophy, Lock, ChevronDown, ChevronUp } from "lucide-react";
import type { AchievementResult } from "@/lib/achievements";
import { useColors } from "@/contexts/theme-context";

const TIER_COLORS: Record<string, string> = {
  bronze:   "#cd7f32",
  silver:   "#a8a9ad",
  gold:     "#f59e0b",
  platinum: "#a855f7",
};

export function AchievementsCard({ achievements }: { achievements: AchievementResult[] }) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked   = achievements.filter((a) => !a.unlocked);
  const visible  = expanded ? achievements : achievements.filter((a) => a.unlocked).slice(0, 8);

  if (achievements.length === 0) return null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: c.bgCard,
        borderColor: c.border,
        boxShadow: c.shadow,
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between border-b"
        style={{ borderColor: c.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#f59e0b18" }}
          >
            <Trophy className="h-4 w-4" style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: c.text }}>Achievements</h2>
            <p className="text-xs" style={{ color: c.textDim }}>
              {unlocked.length} / {achievements.length} unlocked
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: c.border }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(unlocked.length / achievements.length) * 100}%`,
              background: "linear-gradient(90deg, #f59e0b, #a855f7)",
            }}
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="p-5">
        {unlocked.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: c.textMuted }}>
            Complete your first habit to start earning badges!
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {visible.map((a) => (
              <BadgeTile key={a.id} achievement={a} c={c} />
            ))}
            {!expanded && locked.length > 0 && unlocked.length < 8 && (
              <>
                {locked.slice(0, Math.max(0, 8 - unlocked.length)).map((a) => (
                  <BadgeTile key={a.id} achievement={a} c={c} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Show more/less */}
        {achievements.length > 8 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ backgroundColor: c.bgSubtle, color: c.textMuted }}
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" /> Show all {achievements.length}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function BadgeTile({
  achievement: a,
  c,
}: {
  achievement: AchievementResult;
  c: ReturnType<typeof useColors>;
}) {
  const tierColor = TIER_COLORS[a.tier];

  return (
    <div
      title={`${a.name}: ${a.description}`}
      className="flex flex-col items-center gap-1.5 cursor-default group"
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center relative transition-transform group-hover:scale-105"
        style={{
          backgroundColor: a.unlocked ? `${tierColor}18` : c.bgSubtle,
          border: `2px solid ${a.unlocked ? `${tierColor}50` : c.borderInput}`,
          boxShadow: a.unlocked ? `0 0 12px ${tierColor}22` : "none",
        }}
      >
        {a.unlocked ? (
          <span className="text-2xl">{a.emoji}</span>
        ) : (
          <Lock className="h-5 w-5" style={{ color: c.borderInput }} />
        )}

        {/* Tier dot */}
        {a.unlocked && (
          <div
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2"
            style={{
              backgroundColor: tierColor,
              borderColor: c.bgCard,
              color: "white",
            }}
          >
            {a.tier === "platinum" ? "P" : a.tier === "gold" ? "G" : a.tier === "silver" ? "S" : "B"}
          </div>
        )}
      </div>
      <span
        className="text-[10px] font-medium text-center leading-tight"
        style={{ color: a.unlocked ? c.text2 : c.textDim }}
      >
        {a.name}
      </span>
    </div>
  );
}
