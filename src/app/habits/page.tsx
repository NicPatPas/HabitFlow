"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitCard } from "@/components/habits/habit-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Flame, BookOpen } from "lucide-react";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { HABIT_TEMPLATES, TEMPLATE_CATEGORIES, CATEGORY_META, type HabitTemplate, type TemplateCategory } from "@/lib/habit-templates";
import { useColors } from "@/contexts/theme-context";
import type { HabitFormData } from "@/types";
import type { Habit } from "@prisma/client";
import type { StreakResult } from "@/lib/streak";

type HabitWithStreak = Habit & { streak: StreakResult };

export default function HabitsPage() {
  const c = useColors();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function loadHabits() {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setHabits(json.habits ?? []);
    setLoading(false);
  }

  useEffect(() => { loadHabits(); }, []);

  async function handleCreate(data: HabitFormData) {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setCreateOpen(false);
    loadHabits();
  }

  async function handleTemplateComplete(templates: HabitTemplate[]) {
    for (const t of templates) {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name, emoji: t.emoji, color: t.color,
          frequencyType: t.frequencyType, frequencyDays: t.frequencyDays,
          targetValue: t.targetValue, targetUnit: t.targetUnit,
          difficulty: t.difficulty, reminderTime: "", streakFreeze: false,
        }),
      });
    }
    setTemplateOpen(false);
    loadHabits();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    loadHabits();
  }

  async function handleUpdate(id: string, data: HabitFormData) {
    await fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadHabits();
  }

  const filtered = habits.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  const onStreak = habits.filter((h) => h.streak.currentStreak > 0).length;

  return (
    <div className="space-y-10 pb-16">
      {templateOpen && (
        <OnboardingFlow onComplete={handleTemplateComplete} onSkip={() => setTemplateOpen(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: c.text }}>Habits</h1>
          <p className="text-sm mt-0.5" style={{ color: c.textMuted }}>
            Manage your habit library
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTemplateOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all hover:brightness-110 active:scale-95"
            style={{ borderColor: c.borderInput, backgroundColor: c.bgCard, color: c.textMuted }}
          >
            <BookOpen className="h-3.5 w-3.5" /> Templates
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}
          >
            <Plus className="h-3.5 w-3.5" /> New Habit
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && habits.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: c.textMuted }}>
            <span className="font-semibold" style={{ color: c.text2 }}>{habits.length}</span> total
          </span>
          {onStreak > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" style={{ color: "#f97316" }} />
              <span className="font-semibold" style={{ color: "#f97316" }}>{onStreak}</span>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>on streak</span>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {habits.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            placeholder="Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: c.bgInput,
              border: `1px solid ${c.borderInput}`,
              color: c.text,
              paddingLeft: "2.25rem",
              paddingRight: "1rem",
              paddingTop: "0.625rem",
              paddingBottom: "0.625rem",
            }}
            onFocus={(e) => { e.target.style.borderColor = "hsl(262 80% 65% / 0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = c.borderInput; }}
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              streak={h.streak}
              todayCheckIn={null}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : search ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p style={{ color: c.textMuted }}>No habits match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: c.text }}>No habits yet</h3>
          <p className="text-sm mb-6" style={{ color: c.textMuted }}>
            Create your first habit to start tracking your progress.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setTemplateOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}
            >
              <BookOpen className="h-4 w-4" /> Browse templates
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:brightness-110 active:scale-95"
              style={{ borderColor: c.borderInput, backgroundColor: c.bgCard, color: c.text }}
            >
              <Plus className="h-4 w-4" /> Create custom
            </button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: c.bgCard, borderColor: c.border }}>
          <HabitForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
