import { PrismaClient } from "@prisma/client";
import { format, subDays } from "date-fns";

// String literal types (SQLite doesn't support Prisma enums)
const FrequencyType = { DAILY: "DAILY", WEEKLY: "WEEKLY", CUSTOM: "CUSTOM" } as const;
const Difficulty = { EASY: "EASY", MEDIUM: "MEDIUM", HARD: "HARD" } as const;
const CheckInStatus = { DONE: "DONE", PARTIAL: "PARTIAL", SKIPPED: "SKIPPED", FAILED: "FAILED" } as const;
type CheckInStatusType = typeof CheckInStatus[keyof typeof CheckInStatus];

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.habitCheckIn.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: { id: "demo-user-id", name: "Demo User", email: "demo@habits.app" },
  });

  // Create habits
  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        id: "habit-workout",
        userId: user.id,
        name: "Workout",
        emoji: "💪",
        color: "#ef4444",
        frequencyType: FrequencyType.WEEKLY,
        frequencyDays: 3,
        targetValue: 60,
        targetUnit: "minutes",
        difficulty: Difficulty.HARD,
        reminderTime: "07:00",
      },
    }),
    prisma.habit.create({
      data: {
        id: "habit-reading",
        userId: user.id,
        name: "Read",
        emoji: "📚",
        color: "#8b5cf6",
        frequencyType: FrequencyType.DAILY,
        frequencyDays: 7,
        targetValue: 30,
        targetUnit: "minutes",
        difficulty: Difficulty.EASY,
        reminderTime: "21:00",
      },
    }),
    prisma.habit.create({
      data: {
        id: "habit-water",
        userId: user.id,
        name: "Drink Water",
        emoji: "💧",
        color: "#3b82f6",
        frequencyType: FrequencyType.DAILY,
        frequencyDays: 7,
        targetValue: 8,
        targetUnit: "glasses",
        difficulty: Difficulty.EASY,
      },
    }),
    prisma.habit.create({
      data: {
        id: "habit-coding",
        userId: user.id,
        name: "Coding Practice",
        emoji: "💻",
        color: "#10b981",
        frequencyType: FrequencyType.DAILY,
        frequencyDays: 7,
        targetValue: 60,
        targetUnit: "minutes",
        difficulty: Difficulty.MEDIUM,
        reminderTime: "20:00",
      },
    }),
    prisma.habit.create({
      data: {
        id: "habit-meditation",
        userId: user.id,
        name: "Meditate",
        emoji: "🧘",
        color: "#f59e0b",
        frequencyType: FrequencyType.DAILY,
        frequencyDays: 7,
        targetValue: 10,
        targetUnit: "minutes",
        difficulty: Difficulty.EASY,
        reminderTime: "06:30",
      },
    }),
    prisma.habit.create({
      data: {
        id: "habit-no-sugar",
        userId: user.id,
        name: "No Sugar",
        emoji: "🚫",
        color: "#ec4899",
        frequencyType: FrequencyType.DAILY,
        frequencyDays: 7,
        difficulty: Difficulty.HARD,
      },
    }),
  ]);

  // Generate 60 days of check-in history
  const today = new Date();

  // Helper to create varied check-ins
  function getStatus(habitId: string, dayIndex: number, seed: number): CheckInStatusType | null {
    const roll = (seed * 17 + dayIndex * 7 + habitId.length * 3) % 100;

    if (habitId === "habit-workout") {
      // 3x/week pattern with some misses
      const dayOfWeek = (dayIndex) % 7;
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        if (roll < 75) return CheckInStatus.DONE;
        if (roll < 85) return CheckInStatus.PARTIAL;
        return CheckInStatus.FAILED;
      }
      return null; // rest days
    }

    if (roll < 65) return CheckInStatus.DONE;
    if (roll < 75) return CheckInStatus.PARTIAL;
    if (roll < 82) return CheckInStatus.SKIPPED;
    if (roll < 90) return CheckInStatus.FAILED;
    return null; // no check-in
  }

  const checkIns: Array<{
    habitId: string;
    date: string;
    status: CheckInStatusType;
    valueCompleted?: number;
    targetValueSnapshot?: number;
  }> = [];

  for (let i = 60; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const seed = i * 13;

    for (const habit of habits) {
      const status = getStatus(habit.id, i, seed);
      if (status === null) continue;

      let valueCompleted: number | undefined;
      const targetValueSnapshot = habit.targetValue ?? undefined;

      if (habit.targetValue) {
        if (status === CheckInStatus.DONE) valueCompleted = habit.targetValue;
        else if (status === CheckInStatus.PARTIAL)
          valueCompleted = Math.round((habit.targetValue * ((seed % 40) + 30)) / 100);
        else valueCompleted = 0;
      }

      checkIns.push({
        habitId: habit.id,
        date,
        status,
        valueCompleted,
        targetValueSnapshot,
      });
    }
  }

  await prisma.habitCheckIn.createMany({ data: checkIns });

  console.log(`Seeded: 1 user, ${habits.length} habits, ${checkIns.length} check-ins`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
