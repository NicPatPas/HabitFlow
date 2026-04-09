import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const habitId = searchParams.get("habitId");

    const where = habitId ? { habitId, date } : { date };
    const checkIns = await prisma.habitCheckIn.findMany({ where });
    return NextResponse.json(checkIns);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { habitId, date, status, valueCompleted, notes } = body;

    if (!habitId || !status) {
      return NextResponse.json({ error: "habitId and status required" }, { status: 400 });
    }

    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    const checkInDate = date || format(new Date(), "yyyy-MM-dd");

    const checkIn = await prisma.habitCheckIn.upsert({
      where: { habitId_date: { habitId, date: checkInDate } },
      create: {
        habitId,
        date: checkInDate,
        status,
        valueCompleted: valueCompleted != null ? parseFloat(valueCompleted) : null,
        targetValueSnapshot: habit.targetValue,
        notes: notes || null,
      },
      update: {
        status,
        valueCompleted: valueCompleted != null ? parseFloat(valueCompleted) : null,
        targetValueSnapshot: habit.targetValue,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(checkIn);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }
}
