import { Habit, HabitCheckIn, User } from "@prisma/client";
import { StreakResult } from "@/lib/streak";

export type { Habit, HabitCheckIn, User };

export type HabitWithStreak = Habit & {
  streak: StreakResult;
  todayCheckIn?: HabitCheckIn | null;
  checkIns?: HabitCheckIn[];
};

export type HabitFormData = {
  name: string;
  emoji: string;
  color: string;
  frequencyType: "DAILY" | "WEEKLY" | "CUSTOM";
  frequencyDays: number;
  targetValue: string;
  targetUnit: string;
  reminderTime: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  streakFreeze: boolean;
};

export type CheckInFormData = {
  status: "DONE" | "PARTIAL" | "SKIPPED" | "FAILED";
  valueCompleted?: number;
  notes?: string;
};

export const HABIT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export const HABIT_EMOJIS = [
  "💪", "📚", "💧", "💻", "🧘", "🚫", "🏃", "🎯",
  "✅", "⭐", "🔥", "💊", "🥗", "😴", "🎵", "✍️",
  "🧠", "💰", "🌱", "🤸", "🚴", "🏊", "🧹", "📝",
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

export const STATUS_CONFIG = {
  DONE: { label: "Done", color: "#22c55e", bg: "bg-green-500", text: "text-green-600", icon: "✓" },
  PARTIAL: { label: "Partial", color: "#f59e0b", bg: "bg-amber-500", text: "text-amber-600", icon: "◑" },
  SKIPPED: { label: "Skipped", color: "#6b7280", bg: "bg-gray-500", text: "text-gray-500", icon: "→" },
  FAILED: { label: "Failed", color: "#ef4444", bg: "bg-red-500", text: "text-red-600", icon: "✗" },
};
