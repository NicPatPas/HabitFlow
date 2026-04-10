"use client";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Sparkles, X } from "lucide-react";
import {
  HABIT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_META,
  type HabitTemplate,
  type TemplateCategory,
} from "@/lib/habit-templates";
import { useColors } from "@/contexts/theme-context";

type Goal =
  | "build_fitness"
  | "reduce_stress"
  | "improve_health"
  | "learn_more"
  | "boost_productivity";

const GOALS: { id: Goal; label: string; emoji: string; categories: TemplateCategory[] }[] = [
  { id: "build_fitness",       label: "Build fitness",       emoji: "🏃", categories: ["Fitness"] },
  { id: "reduce_stress",       label: "Reduce stress",       emoji: "🧘", categories: ["Mindfulness"] },
  { id: "improve_health",      label: "Improve health",      emoji: "💚", categories: ["Health"] },
  { id: "learn_more",          label: "Learn & grow",        emoji: "📚", categories: ["Learning"] },
  { id: "boost_productivity",  label: "Boost productivity",  emoji: "🎯", categories: ["Productivity"] },
];

type Props = {
  onComplete: (habits: HabitTemplate[]) => Promise<void>;
  onSkip: () => void;
};

export function OnboardingFlow({ onComplete, onSkip }: Props) {
  const c = useColors();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const relevantCategories = selectedGoals.length === 0
    ? TEMPLATE_CATEGORIES
    : [...new Set(selectedGoals.flatMap((g) => GOALS.find((x) => x.id === g)!.categories))];

  const filteredTemplates = HABIT_TEMPLATES.filter(
    (t) => relevantCategories.includes(t.category)
  );

  function toggleGoal(id: Goal) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleTemplate(idx: number) {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleFinish() {
    if (selectedTemplates.size === 0) { onSkip(); return; }
    setSaving(true);
    const chosen = [...selectedTemplates].map((i) => filteredTemplates[i]);
    await onComplete(chosen);
  }

  const stepDots = [1, 2, 3] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "hsl(240 10% 4% / 0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{
          backgroundColor: c.bgCard,
          borderColor: c.border,
          boxShadow: "0 24px 80px hsl(240 10% 3% / 0.8)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: "#8b5cf6" }} />
              <span className="text-sm font-semibold" style={{ color: c.text }}>Welcome to HabitFlow</span>
            </div>
            <button
              onClick={onSkip}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: c.textMuted }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {stepDots.map((s) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  flex: s === step ? 2 : 1,
                  backgroundColor: s === step
                    ? "#8b5cf6"
                    : s < step
                    ? "#8b5cf660"
                    : c.border,
                }}
              />
            ))}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: c.text }}>
                  What are your goals?
                </h2>
                <p className="text-sm" style={{ color: c.textMuted }}>
                  Pick one or more — we'll suggest habits that fit.
                </p>
              </div>
              <div className="space-y-2">
                {GOALS.map((goal) => {
                  const active = selectedGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all"
                      style={{
                        backgroundColor: active ? "hsl(262 80% 65% / 0.12)" : c.bgSubtle,
                        borderColor: active ? "hsl(262 80% 65% / 0.4)" : c.borderInput,
                      }}
                    >
                      <span className="text-xl">{goal.emoji}</span>
                      <span className="text-sm font-medium flex-1" style={{ color: c.text }}>
                        {goal.label}
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#8b5cf6" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: c.text }}>
                  Pick your habits
                </h2>
                <p className="text-sm" style={{ color: c.textMuted }}>
                  Choose the habits you want to start tracking. You can always add more later.
                </p>
              </div>

              {(selectedGoals.length === 0 ? TEMPLATE_CATEGORIES : relevantCategories).map((cat) => {
                const catTemplates = filteredTemplates.filter((t) => t.category === cat);
                if (catTemplates.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>
                        {cat}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {catTemplates.map((t) => {
                        const globalIdx = filteredTemplates.indexOf(t);
                        const selected = selectedTemplates.has(globalIdx);
                        return (
                          <button
                            key={t.name}
                            onClick={() => toggleTemplate(globalIdx)}
                            className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                            style={{
                              backgroundColor: selected ? `${t.color}12` : c.bgSubtle,
                              borderColor: selected ? `${t.color}40` : c.borderInput,
                            }}
                          >
                            <div
                              className="h-9 w-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: `${t.color}18`, border: `1.5px solid ${t.color}35` }}
                            >
                              {t.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: c.text }}>{t.name}</div>
                              {t.targetValue && (
                                <div className="text-xs mt-0.5" style={{ color: c.textMuted }}>
                                  {t.targetValue} {t.targetUnit} · {t.difficulty.toLowerCase()}
                                </div>
                              )}
                            </div>
                            {selected && (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: t.color }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="pt-4">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold mb-2" style={{ color: c.text }}>
                  You're all set!
                </h2>
                <p className="text-sm" style={{ color: c.textMuted }}>
                  {selectedTemplates.size > 0
                    ? `${selectedTemplates.size} habit${selectedTemplates.size > 1 ? "s" : ""} added to your library. Start your first check-in today!`
                    : "Your habit library is ready. Create your first habit whenever you're ready."}
                </p>
              </div>

              {selectedTemplates.size > 0 && (
                <div className="space-y-2 text-left">
                  {[...selectedTemplates].slice(0, 5).map((i) => {
                    const t = filteredTemplates[i];
                    if (!t) return null;
                    return (
                      <div
                        key={t.name}
                        className="flex items-center gap-3 rounded-xl border px-4 py-3"
                        style={{ backgroundColor: `${t.color}10`, borderColor: `${t.color}30` }}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: c.text }}>{t.name}</span>
                      </div>
                    );
                  })}
                  {selectedTemplates.size > 5 && (
                    <p className="text-xs text-center" style={{ color: c.textMuted }}>
                      +{selectedTemplates.size - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 pt-2 flex-shrink-0 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: c.bgSubtle, color: c.textMuted, border: `1px solid ${c.borderInput}` }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
              else handleFinish();
            }}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-98"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
          >
            {step === 3 ? (
              saving ? "Adding habits…" : selectedTemplates.size > 0 ? "Start tracking!" : "Start fresh"
            ) : (
              <>
                {step === 1 ? (selectedGoals.length === 0 ? "Skip" : "Next") : "Next"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
