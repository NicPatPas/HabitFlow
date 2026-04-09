import { NextResponse } from "next/server";
import { prisma, DEMO_USER_ID } from "@/lib/db";
import { calculateStreak } from "@/lib/streak";
import { format } from "date-fns";

export async function GET() {
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const habits = await prisma.habit.findMany({
      where: { userId: DEMO_USER_ID, archivedAt: null },
      include: {
        checkIns: {
          orderBy: { date: "asc" },
          take: 90,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const habitsWithStreak = habits.map((h) => {
      const streak = calculateStreak(h.checkIns, {
        frequencyType: h.frequencyType,
        frequencyDays: h.frequencyDays,
        targetValue: h.targetValue,
        streakFreeze: h.streakFreeze,
      });
      const todayCheckIn = h.checkIns.find((ci) => ci.date === today) || null;
      return { ...h, streak, todayCheckIn };
    });

    const todayCheckIns = habitsWithStreak.map((h) => h.todayCheckIn).filter(Boolean);
    const completed = todayCheckIns.filter((ci) => ci?.status === "DONE" || ci?.status === "PARTIAL").length;

    return NextResponse.json({
      habits: habitsWithStreak,
      todayProgress: {
        completed,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
