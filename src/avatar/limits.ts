/**
 * Temporary rigid-motion channels for the unrigged cutout.
 * These are NOT Mesh Avatar Studio rig fields. Do not rename them
 * to look like rig.json keys. Every posed value goes through clampChannel.
 */

export const LIMITS = {
  swayDeg: { min: -1.6, max: 1.6 },
  bobPx: { min: -6, max: 6 },
  shiftXPx: { min: -10, max: 10 },
  mouth: { min: 0, max: 1 },
} as const;

export type Channel = keyof typeof LIMITS;

/** Max change per second. Mouth releases slower than it attacks. */
export const RATE = {
  swayDeg: 1.4,
  bobPx: 10,
  shiftXPx: 16,
  mouthAttack: 7,
  mouthRelease: 2.4,
} as const;

export function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function clampChannel(channel: Channel, n: number) {
  const { min, max } = LIMITS[channel];
  return clamp(n, min, max);
}

export function approach(current: number, target: number, maxDelta: number) {
  const step = Math.max(0, maxDelta);
  const delta = target - current;
  if (delta > step) return current + step;
  if (delta < -step) return current - step;
  return target;
}

export function easeChannel(
  channel: Exclude<Channel, "mouth">,
  current: number,
  target: number,
  dt: number,
) {
  const clamped = clampChannel(channel, target);
  return approach(current, clamped, RATE[channel] * dt);
}

export function easeMouth(current: number, target: number, dt: number) {
  const clamped = clampChannel("mouth", target);
  const rate = clamped > current ? RATE.mouthAttack : RATE.mouthRelease;
  return approach(current, clamped, rate * dt);
}
