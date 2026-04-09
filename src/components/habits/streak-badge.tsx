import { Flame, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreakResult } from "@/lib/streak";

interface StreakBadgeProps {
  streak: StreakResult;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const isActive = streak.currentStreak > 0;
  const isOnFire = streak.currentStreak >= 7;
  const isLegendary = streak.currentStreak >= 30;

  const sizes = {
    sm: { flame: "h-3.5 w-3.5", text: "text-xs", container: "gap-1 px-2 py-0.5" },
    md: { flame: "h-4 w-4", text: "text-sm font-bold", container: "gap-1.5 px-3 py-1" },
    lg: { flame: "h-5 w-5", text: "text-base font-bold", container: "gap-2 px-4 py-2" },
  };

  const s = sizes[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full transition-all",
        s.container,
        isLegendary
          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md"
          : isOnFire
          ? "bg-orange-100 text-orange-600"
          : isActive
          ? "bg-muted text-foreground"
          : "bg-muted/50 text-muted-foreground/50"
      )}
    >
      {isLegendary ? (
        <Trophy className={s.flame} />
      ) : (
        <Flame className={cn(s.flame, isActive && !isLegendary ? "text-orange-500" : "")} />
      )}
      <span className={s.text}>{streak.currentStreak}</span>
      {size !== "sm" && (
        <span className={cn("opacity-70", size === "lg" ? "text-sm" : "text-xs")}>
          {streak.currentStreak === 1 ? "day" : "days"}
        </span>
      )}
    </div>
  );
}
