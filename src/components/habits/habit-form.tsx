"use client";
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { HABIT_COLORS, HABIT_EMOJIS, type HabitFormData } from "@/types";
import { Loader2 } from "lucide-react";

interface HabitFormProps {
  initialData?: Partial<HabitFormData>;
  onSubmit: (data: HabitFormData) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

const defaultData: HabitFormData = {
  name: "",
  emoji: "✅",
  color: "#6366f1",
  frequencyType: "DAILY",
  frequencyDays: 7,
  targetValue: "",
  targetUnit: "",
  reminderTime: "",
  difficulty: "MEDIUM",
  streakFreeze: false,
};

const inputClass = "w-full rounded-xl px-3 py-2 text-sm outline-none transition-all";
const inputStyle = {
  backgroundColor: "hsl(240 8% 10%)",
  border: "1px solid hsl(240 5% 18%)",
  color: "hsl(0 0% 95%)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
      {children}
    </label>
  );
}

export function HabitForm({ initialData, onSubmit, onCancel, mode }: HabitFormProps) {
  const [form, setForm] = useState<HabitFormData>({ ...defaultData, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    }
    if (emojiOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiOpen]);

  function set<K extends keyof HabitFormData>(key: K, value: HabitFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Habit name is required."); return; }
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle style={{ color: "hsl(0 0% 95%)" }}>
          {mode === "create" ? "Create New Habit" : "Edit Habit"}
        </DialogTitle>
        <DialogDescription style={{ color: "hsl(var(--muted-foreground))" }}>
          {mode === "create" ? "Set up your new habit and start building your streak." : "Update your habit settings."}
        </DialogDescription>
      </DialogHeader>

      {/* Name + Emoji */}
      <div>
        <FieldLabel>Habit Name *</FieldLabel>
        <div className="flex gap-2">
          {/* Custom emoji picker */}
          <div ref={emojiRef} className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              className="h-9 w-14 rounded-xl text-xl flex items-center justify-center transition-all"
              style={{
                backgroundColor: "hsl(240 8% 10%)",
                border: `1px solid ${emojiOpen ? "hsl(262 80% 65% / 0.5)" : "hsl(240 5% 18%)"}`,
              }}
            >
              {form.emoji}
            </button>
            {emojiOpen && (
              <div
                className="absolute top-10 left-0 z-50 rounded-xl p-2 shadow-xl"
                style={{ backgroundColor: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 20%)", width: "13rem" }}
              >
                <div className="grid grid-cols-6 gap-1">
                  {HABIT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onMouseDown={(ev) => { ev.preventDefault(); set("emoji", e); setEmojiOpen(false); }}
                      className="text-xl p-1.5 rounded-lg transition-colors hover:bg-white/10"
                      style={{
                        backgroundColor: form.emoji === e ? "hsl(262 80% 65% / 0.2)" : "transparent",
                        outline: form.emoji === e ? "1px solid hsl(262 80% 65% / 0.5)" : "none",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Read 30 minutes"
            className={`flex-1 ${inputClass}`}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "hsl(262 80% 65% / 0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <FieldLabel>Color</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("color", color)}
              className="h-7 w-7 rounded-full transition-all duration-150"
              style={{
                backgroundColor: color,
                transform: form.color === color ? "scale(1.15)" : "scale(1)",
                boxShadow: form.color === color ? `0 0 0 2px hsl(240 8% 10%), 0 0 0 4px ${color}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Frequency</FieldLabel>
          <Select value={form.frequencyType} onValueChange={(v) => set("frequencyType", v as HabitFormData["frequencyType"])}>
            <SelectTrigger style={{ backgroundColor: "hsl(240 8% 10%)", borderColor: "hsl(240 5% 18%)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.frequencyType !== "DAILY" && (
          <div>
            <FieldLabel>Times per week</FieldLabel>
            <Select value={String(form.frequencyDays)} onValueChange={(v) => set("frequencyDays", parseInt(v))}>
              <SelectTrigger style={{ backgroundColor: "hsl(240 8% 10%)", borderColor: "hsl(240 5% 18%)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}x / week</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Target */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Target (optional)</FieldLabel>
          <input
            type="number"
            min="0"
            step="any"
            value={form.targetValue}
            onChange={(e) => set("targetValue", e.target.value)}
            placeholder="e.g. 30"
            className={inputClass}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "hsl(262 80% 65% / 0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
          />
        </div>
        <div>
          <FieldLabel>Unit</FieldLabel>
          <input
            value={form.targetUnit}
            onChange={(e) => set("targetUnit", e.target.value)}
            placeholder="e.g. minutes"
            className={inputClass}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "hsl(262 80% 65% / 0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
          />
        </div>
      </div>

      {/* Difficulty + Reminder */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Difficulty</FieldLabel>
          <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v as HabitFormData["difficulty"])}>
            <SelectTrigger style={{ backgroundColor: "hsl(240 8% 10%)", borderColor: "hsl(240 5% 18%)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">😌 Easy</SelectItem>
              <SelectItem value="MEDIUM">😤 Medium</SelectItem>
              <SelectItem value="HARD">🔥 Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Reminder time</FieldLabel>
          <input
            type="time"
            value={form.reminderTime}
            onChange={(e) => set("reminderTime", e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, colorScheme: "dark" }}
            onFocus={(e) => { e.target.style.borderColor = "hsl(262 80% 65% / 0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
          />
        </div>
      </div>

      {/* Streak freeze */}
      <div className="flex items-center justify-between rounded-xl p-4"
        style={{ backgroundColor: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)" }}>
        <div>
          <div className="text-sm font-medium" style={{ color: "hsl(0 0% 90%)" }}>Streak Freeze</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Protect streak from one missed day
          </div>
        </div>
        <Switch checked={form.streakFreeze} onCheckedChange={(v) => set("streakFreeze", v)} />
      </div>

      {error && <p className="text-sm" style={{ color: "hsl(0 72% 60%)" }}>{error}</p>}

      <DialogFooter className="gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:brightness-110"
          style={{ backgroundColor: "hsl(240 6% 13%)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(240 5% 18%)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Habit" : "Save Changes"}
        </button>
      </DialogFooter>
    </form>
  );
}
