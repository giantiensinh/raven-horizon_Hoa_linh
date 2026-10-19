import type { Emotion, Gaze, Gesture } from "./types";

/**
 * Biases are in the rigid channels from limits.ts, not mesh parameters.
 * Missing rig fields (blink layers, vowel mouths, physics) are intentionally
 * absent: the renderer skips them instead of inventing a warp.
 */
export type Bias = { swayDeg: number; bobPx: number; shiftXPx: number };

export const emotionBias: Record<Emotion, Bias> = {
  neutral: { swayDeg: 0, bobPx: 0, shiftXPx: 0 },
  happy: { swayDeg: 0.35, bobPx: -1.4, shiftXPx: 0 },
  sad: { swayDeg: -0.25, bobPx: 2, shiftXPx: 0 },
  angry: { swayDeg: 0.1, bobPx: 1, shiftXPx: 0 },
  surprised: { swayDeg: 0.2, bobPx: -2.2, shiftXPx: 0 },
};

export const gazeShift: Record<Gaze, number> = {
  camera: 0,
  chat: 6,
  away: -6,
};

export function gestureBias(gesture: Gesture, ageSec: number): Bias {
  const life = 1.25;
  const left = Math.max(0, 1 - ageSec / life);
  if (left <= 0 || gesture === "none") {
    return { swayDeg: 0, bobPx: 0, shiftXPx: 0 };
  }
  const wave = Math.sin(ageSec * 9) * left;
  switch (gesture) {
    case "nod":
      return { swayDeg: 0, bobPx: wave * 3, shiftXPx: 0 };
    case "shake":
      return { swayDeg: 0, bobPx: 0, shiftXPx: wave * 6 };
    case "tilt":
      return { swayDeg: 1.05 * left, bobPx: 0, shiftXPx: 0 };
    case "lean_in":
      return { swayDeg: 0, bobPx: -3.2 * left, shiftXPx: 0 };
    default:
      return { swayDeg: 0, bobPx: 0, shiftXPx: 0 };
  }
}
