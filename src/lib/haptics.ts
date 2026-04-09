/** Light tap — single habit completion */
export function hapticLight() {
  try { navigator.vibrate?.(12); } catch { /* unsupported */ }
}

/** Success pattern — streak extended */
export function hapticSuccess() {
  try { navigator.vibrate?.([15, 60, 25]); } catch { /* unsupported */ }
}

/** Milestone pattern — new best streak or 7/30/100 day milestone */
export function hapticMilestone() {
  try { navigator.vibrate?.([20, 40, 20, 40, 50]); } catch { /* unsupported */ }
}
