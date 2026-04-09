import { NextResponse } from "next/server";
import { prisma, DEMO_USER_ID } from "@/lib/db";
import { calculateStreak, getGlobalStreakSummary } from "@/lib/streak";
import { getWeeklyChart, getDailyChart, getHeatmapData, getDayOfWeekStats, getAveragePerDay, getBestDayOfWeek } from "@/lib/analytics";

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: DEMO_USER_ID, archivedAt: null },
      include: { checkIns: { orderBy: { date: "asc" } } },
    });

    const allCheckIns = habits.flatMap((h) =>
      h.checkIns.map((ci) => ({ habitId: h.id, date: ci.date, status: ci.status }))
    );

    // Per-habit streaks
    const habitStreaks = habits.map((h) => ({
      habitId: h.id,
      ...calculateStreak(h.checkIns, {
        frequencyType: h.frequencyType,
        frequencyDays: h.frequencyDays,
        targetValue: h.targetValue,
        streakFreeze: h.streakFreeze,
      }),
    }));

    const globalStreak = getGlobalStreakSummary(habitStreaks);
    const weeklyChart = getWeeklyChart(allCheckIns, habits.length, 12);
    const dailyChart = getDailyChart(allCheckIns, 30);
    const heatmap = getHeatmapData(allCheckIns, 365);
    const dowStats = getDayOfWeekStats(allCheckIns);
    const avgPerDay = getAveragePerDay(allCheckIns, 30);
    const bestDay = getBestDayOfWeek(dowStats);

    const totalCheckIns = allCheckIns.length;
    const completedCheckIns = allCheckIns.filter((ci) => ci.status === "DONE" || ci.status === "PARTIAL").length;
    const overallCompletionRate = totalCheckIns > 0 ? Math.round((completedCheckIns / totalCheckIns) * 100) : 0;

    return NextResponse.json({
      globalStreak,
      habitStreaks,
      weeklyChart,
      dailyChart,
      heatmap,
      dowStats,
      avgPerDay,
      bestDay,
      overallCompletionRate,
      totalHabits: habits.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
