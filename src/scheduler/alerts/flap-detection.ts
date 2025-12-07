// src/scheduler/alerts/flap-detection.ts

/** Window duration for counting state transitions (10 minutes) */
const FLAP_WINDOW_MS = 10 * 60 * 1000;

/** Number of state transitions in the window that indicates flapping */
const FLAP_THRESHOLD = 3;

export interface FlapState {
  stateChanges: number;
  flapWindowStart: Date | null;
}

export interface FlapResult {
  isFlapping: boolean;
  stateChanges: number;
  flapWindowStart: Date | null;
}

/**
 * Update flap tracking after a state transition and determine if the alert is flapping.
 * Call this whenever an alert transitions between ok and firing.
 */
export function trackStateTransition(current: FlapState): FlapResult {
  const now = Date.now();
  const windowStart = current.flapWindowStart?.getTime() ?? 0;

  // If we're outside the window, start a new one
  if (now - windowStart > FLAP_WINDOW_MS) {
    return {
      isFlapping: false,
      stateChanges: 1,
      flapWindowStart: new Date(now),
    };
  }

  // Inside the window — increment counter
  const newCount = current.stateChanges + 1;
  return {
    isFlapping: newCount >= FLAP_THRESHOLD,
    stateChanges: newCount,
    flapWindowStart: current.flapWindowStart,
  };
}
