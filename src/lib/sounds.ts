/** Optional sound feedback. Disabled by default — user enables in settings. */

const STORAGE_KEY = "habitflow_sounds_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(v));
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.08,
  type: OscillatorType = "sine"
) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch { /* ignore */ }
}

/** Subtle two-note completion tick — C5 → E5 */
export function playComplete() {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  playTone(523, t, 0.18, 0.08);       // C5
  playTone(659, t + 0.09, 0.22, 0.07); // E5
}

/** Three-note ascending arpeggio — milestone or new best */
export function playMilestone() {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  playTone(523, t, 0.22, 0.09);        // C5
  playTone(659, t + 0.10, 0.22, 0.08); // E5
  playTone(784, t + 0.20, 0.35, 0.09); // G5
}
