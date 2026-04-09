import { NextRequest, NextResponse } from "next/server";
import { prisma, DEMO_USER_ID } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const habit = await prisma.habit.findFirst({
      where: { id, userId: DEMO_USER_ID },
      include: {
        checkIns: { orderBy: { date: "desc" } },
      },
    });
    if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(habit);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch habit" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name, emoji, color, frequencyType, frequencyDays,
      targetValue, targetUnit, reminderTime, difficulty, streakFreeze,
    } = body;

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(frequencyType !== undefined && { frequencyType }),
        ...(frequencyDays !== undefined && { frequencyDays: parseInt(frequencyDays) }),
        ...(targetValue !== undefined && { targetValue: targetValue ? parseFloat(targetValue) : null }),
        ...(targetUnit !== undefined && { targetUnit: targetUnit?.trim() || null }),
        ...(reminderTime !== undefined && { reminderTime: reminderTime || null }),
        ...(difficulty !== undefined && { difficulty }),
        ...(streakFreeze !== undefined && { streakFreeze }),
      },
    });

    return NextResponse.json(habit);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.habit.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
