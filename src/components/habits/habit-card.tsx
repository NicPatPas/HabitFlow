"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HabitForm } from "./habit-form";
import { STATUS_CONFIG, DIFFICULTY_LABELS, FREQUENCY_LABELS, type HabitFormData } from "@/types";
import { Flame, MoreHorizontal, Edit, Trash2, Target, Zap, Lock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SparkBurst } from "@/components/animations/spark-burst";
import { cn } from "@/lib/utils";
import type { Habit, HabitCheckIn } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

interface HabitCardProps {
  habit: Habit;
  streak: StreakResult;
  todayCheckIn?: HabitCheckIn | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: HabitFormData) => Promise<void>;
  onCheckIn?: (habitId: string) => void;
  showCheckIn?: boolean;
  /** When true, plays spark burst + flame pulse */
  justCompleted?: boolean;
  onBurstDone?: () => void;
}

export function HabitCard({ habit, streak, todayCheckIn, onDelete, onUpdate, onCheckIn, showCheckIn, justCompleted, onBurstDone }: HabitCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const flamePulse = justCompleted && streak.currentStreak > 0;

  const statusConfig = todayCheckIn ? STATUS_CONFIG[todayCheckIn.status] : null;
  const isDone = todayCheckIn?.status === "DONE" || todayCheckIn?.status === "PARTIAL";
  const completionPct = habit.targetValue && todayCheckIn?.valueCompleted != null
    ? Math.min(100, Math.round((todayCheckIn.valueCompleted / habit.targetValue) * 100)) : null;
  const isOnFire = streak.currentStreak >= 7;
  const isLegendary = streak.currentStreak >= 30;
  const streakColor = isLegendary ? "#f59e0b" : isOnFire ? "#f97316" : streak.currentStreak > 0 ? "#fb923c" : undefined;

  return (
    <>
      <div
        className={cn("relative rounded-2xl border transition-all duration-200 overflow-hidden group", isDone && "opacity-60")}
        style={{
          backgroundColor: hovered ? "hsl(240 7% 11%)" : "hsl(240 7% 9%)",
          borderColor: hovered
            ? `${habit.color}45`
            : justCompleted
            ? `${habit.color}50`
            : "hsl(240 4% 16%)",
          boxShadow: justCompleted
            ? `0 0 0 1px ${habit.color}20, 0 4px 24px ${habit.color}18`
            : hovered
            ? `0 0 0 1px ${habit.color}14, 0 8px 32px ${habit.color}0a`
            : "0 2px 12px hsl(240 10% 3% / 0.35)",
          transform: hovered ? "translateY(-1px)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Spark burst on just-completed */}
        {justCompleted && <SparkBurst color={habit.color} onDone={onBurstDone} />}

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: habit.color }} />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Emoji */}
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${habit.color}18`, border: `1px solid ${habit.color}25` }}
            >
              {habit.emoji}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + menu */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className={cn("font-semibold text-sm leading-snug", isDone && "line-through opacity-40")}
                    style={{ color: "hsl(0 0% 95%)" }}
                  >
                    {habit.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: "hsl(240 4% 42%)" }}>
                      {FREQUENCY_LABELS[habit.frequencyType]}
                      {habit.frequencyType !== "DAILY" && ` · ${habit.frequencyDays}×/wk`}
                    </span>
                    {habit.targetValue && (
                      <span className="text-xs flex items-center gap-0.5" style={{ color: "hsl(240 4% 42%)" }}>
                        <Target className="h-3 w-3" />
                        {habit.targetValue} {habit.targetUnit}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      style={{ backgroundColor: "hsl(240 6% 14%)" }}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(habit.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress bar */}
              {completionPct !== null && (
                <div className="mt-3 mb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: "hsl(240 4% 42%)" }}>
                      {todayCheckIn?.valueCompleted} / {habit.targetValue} {habit.targetUnit}
                    </span>
                    <span className="text-xs font-bold" style={{ color: habit.color }}>
                      {completionPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${habit.color}15` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${completionPct}%`, backgroundColor: habit.color }}
                    />
                  </div>
                </div>
              )}

              {/* Footer: streak + status */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Flame
                      className="h-3.5 w-3.5"
                      style={{
                        color: streakColor ?? "hsl(240 4% 38%)",
                        opacity: streak.currentStreak === 0 ? 0.3 : 1,
                        animation: flamePulse ? "flamePulseCard 0.65s ease-out" : "none",
                        filter: flamePulse ? "drop-shadow(0 0 5px #f97316)" : "none",
                      }}
                    />
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: streakColor ?? "hsl(240 4% 38%)",
                        opacity: streak.currentStreak === 0 ? 0.3 : 1,
                      }}
                    >
                      {streak.currentStreak}
                    </span>
                  </div>
                  {streak.bestStreak > 0 && streak.bestStreak !== streak.currentStreak && (
                    <div className="flex items-center gap-0.5" style={{ color: "hsl(240 4% 38%)" }}>
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">best {streak.bestStreak}</span>
                    </div>
                  )}
                  {habit.streakFreeze && <Lock className="h-3 w-3" style={{ color: "#60a5fa" }} />}
                </div>

                {statusConfig ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: statusConfig.color, backgroundColor: `${statusConfig.color}15` }}
                  >
                    {statusConfig.label}
                  </span>
                ) : showCheckIn ? (
                  <button
                    onClick={() => onCheckIn?.(habit.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:brightness-110 active:scale-95"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      color: habit.color,
                      border: `1px solid ${habit.color}30`,
                    }}
                  >
                    Check in →
                  </button>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: "hsl(240 4% 42%)", backgroundColor: "hsl(240 6% 12%)" }}
                  >
                    {DIFFICULTY_LABELS[habit.difficulty]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flamePulseCard {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 2px #f97316); }
          35%  { transform: scale(1.6);  filter: drop-shadow(0 0 9px #f97316) drop-shadow(0 0 16px #f97316cc); }
          65%  { transform: scale(1.35); filter: drop-shadow(0 0 6px #f97316); }
          100% { transform: scale(1);    filter: none; }
        }
      `}</style>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <HabitForm
            mode="edit"
            initialData={{
              name: habit.name,
              emoji: habit.emoji,
              color: habit.color,
              frequencyType: habit.frequencyType as HabitFormData["frequencyType"],
              frequencyDays: habit.frequencyDays,
              targetValue: habit.targetValue?.toString() ?? "",
              targetUnit: habit.targetUnit ?? "",
              reminderTime: habit.reminderTime ?? "",
              difficulty: habit.difficulty as HabitFormData["difficulty"],
              streakFreeze: habit.streakFreeze,
            }}
            onSubmit={async (data) => { await onUpdate(habit.id, data); setEditOpen(false); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
