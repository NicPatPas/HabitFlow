"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { STATUS_CONFIG, type CheckInFormData } from "@/types";
import { cn } from "@/lib/utils";
import type { Habit, HabitCheckIn } from "@prisma/client";

interface CheckInModalProps {
  habit: Habit;
  existingCheckIn?: HabitCheckIn | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: CheckInFormData) => Promise<void>;
}

const STATUSES: Array<CheckInFormData["status"]> = ["DONE", "PARTIAL", "SKIPPED", "FAILED"];
const STATUS_EMOJIS: Record<string, string> = { DONE: "✅", PARTIAL: "⏳", SKIPPED: "⏭️", FAILED: "❌" };

export function CheckInModal({ habit, existingCheckIn, open, onClose, onSave }: CheckInModalProps) {
  const [status, setStatus] = useState<CheckInFormData["status"]>(
    (existingCheckIn?.status as CheckInFormData["status"]) || "DONE"
  );
  const [value, setValue] = useState(existingCheckIn?.valueCompleted?.toString() ?? "");
  const [notes, setNotes] = useState(existingCheckIn?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const showValueInput = habit.targetValue != null;
  const completionPct = habit.targetValue && value
    ? Math.min(100, Math.round((parseFloat(value) / habit.targetValue) * 100))
    : null;

  async function handleSave() {
    setLoading(true);
    try {
      await onSave({
        status,
        valueCompleted: showValueInput && value ? parseFloat(value) : undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" style={{ backgroundColor: "hsl(240 8% 8%)", borderColor: "hsl(240 5% 16%)" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5" style={{ color: "hsl(0 0% 95%)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: `${habit.color}18`, border: `1px solid ${habit.color}30` }}>
              {habit.emoji}
            </div>
            {habit.name}
          </DialogTitle>
          <DialogDescription style={{ color: "hsl(var(--muted-foreground))" }}>
            {habit.targetValue
              ? `Target: ${habit.targetValue} ${habit.targetUnit || "units"}`
              : "How did it go today?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Status buttons */}
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const selected = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-sm font-medium transition-all duration-150"
                  style={{
                    border: `2px solid ${selected ? cfg.color : "hsl(240 5% 18%)"}`,
                    backgroundColor: selected ? `${cfg.color}12` : "hsl(240 8% 10%)",
                    color: selected ? cfg.color : "hsl(var(--muted-foreground))",
                    transform: selected ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <span className="text-xl">{STATUS_EMOJIS[s]}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Numeric progress */}
          {showValueInput && (
            <div className="space-y-2">
              <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                Progress {habit.targetUnit ? `(${habit.targetUnit})` : ""}
                {completionPct !== null && (
                  <span className="ml-2 font-bold" style={{ color: habit.color }}>{completionPct}%</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  max={habit.targetValue ?? undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`0 – ${habit.targetValue}`}
                  className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "hsl(240 8% 10%)",
                    border: "1px solid hsl(240 5% 18%)",
                    color: "hsl(0 0% 95%)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = habit.color; }}
                  onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
                />
                <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>/ {habit.targetValue}</span>
              </div>
              {completionPct !== null && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${habit.color}18` }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%`, backgroundColor: habit.color }} />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              Notes <span style={{ color: "hsl(240 4% 40%)" }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? Any observations..."
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none transition-all"
              style={{
                backgroundColor: "hsl(240 8% 10%)",
                border: "1px solid hsl(240 5% 18%)",
                color: "hsl(0 0% 95%)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(240 5% 28%)"; }}
              onBlur={(e) => { e.target.style.borderColor = "hsl(240 5% 18%)"; }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:brightness-110"
            style={{ backgroundColor: "hsl(240 6% 13%)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(240 5% 18%)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: habit.color }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Check-in
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
