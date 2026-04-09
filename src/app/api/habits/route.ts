import { NextRequest, NextResponse } from "next/server";
import { prisma, DEMO_USER_ID } from "@/lib/db";

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: DEMO_USER_ID, archivedAt: null },
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 90,
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(habits);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, emoji, color, frequencyType, frequencyDays,
      targetValue, targetUnit, reminderTime, difficulty, streakFreeze,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        userId: DEMO_USER_ID,
        name: name.trim(),
        emoji: emoji || "✅",
        color: color || "#6366f1",
        frequencyType: frequencyType || "DAILY",
        frequencyDays: parseInt(frequencyDays) || 7,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        targetUnit: targetUnit?.trim() || null,
        reminderTime: reminderTime || null,
        difficulty: difficulty || "MEDIUM",
        streakFreeze: streakFreeze || false,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
