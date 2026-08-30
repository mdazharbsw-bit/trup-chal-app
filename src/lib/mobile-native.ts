/**
 * Android Native App & PWA Utilities for Trup Chal
 */

// Haptic feedback patterns (in milliseconds)
const HAPTIC_PATTERNS = {
  tap: [12],
  card: [20],
  trump: [30, 40, 30],
  win: [40, 60, 40, 60, 80],
  error: [50, 30, 50],
};

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("trup_haptics_enabled", enabled ? "1" : "0");
  }
}

export function getHapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem("trup_haptics_enabled");
  return val === null ? true : val === "1";
}

/**
 * Triggers vibration haptics on Android devices
 */
export function triggerHaptic(type: keyof typeof HAPTIC_PATTERNS = "tap") {
  if (!hapticsEnabled || typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }
  try {
    const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.tap;
    navigator.vibrate(pattern);
  } catch {
    // Ignore permissions or browser restrictions
  }
}

let wakeLockSentinel: any = null;

/**
 * Keeps the Android screen active during gameplay so it doesn't dim
 */
export async function requestWakeLock() {
  if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
  try {
    if (!wakeLockSentinel) {
      wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
    }
  } catch {
    // Wake lock request failed or rejected
  }
}

export async function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignore release error
    }
    wakeLockSentinel = null;
  }
}

/**
 * Native Android Share API for inviting players
 */
export async function shareGame(roomCode: string, playerName: string): Promise<boolean> {
  const shareData = {
    title: "Play Trup Chal with me!",
    text: `${playerName} invited you to play Trup Chal (Court Piece)! Room Code: ${roomCode}`,
    url: typeof window !== "undefined" ? `${window.location.origin}/play/${roomCode}` : "",
  };

  if (typeof window !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  }

  // Fallback to clipboard copy
  if (typeof window !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareData.url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if app is running in Standalone PWA / Android Native WebView mode
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  return isStandaloneMedia || isIOSStandalone;
}
