/**
 * Live sky: the night stage follows the real sky. Pure functions (no DOM, no three.js), so they
 * are unit-tested and safe to import anywhere.
 */

/** Mean synodic month in days and a reference new moon (2000-01-06 18:14 UTC). */
const SYNODIC_DAYS = 29.530588853;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

/** Moon phase in 0..1: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - REFERENCE_NEW_MOON) / DAY_MS;
  const phase = (days / SYNODIC_DAYS) % 1;
  return phase < 0 ? phase + 1 : phase;
}

/** Lit fraction of the moon's disc (0 new .. 1 full). */
export function moonIllumination(phase: number): number {
  return (1 - Math.cos(phase * Math.PI * 2)) / 2;
}

const bump = (x: number, centre: number, halfWidth: number) => Math.max(0, 1 - Math.abs(x - centre) / halfWidth);

/**
 * Twilight in the visitor's local time: dawn peaks around 05:45, dusk around 18:45 (each fades
 * over about 90 minutes either side). Deep night and daytime are both 0, so the stage stays a
 * night scene; only the horizon picks up a faint warm or violet cast at the edges of the night.
 */
export function twilight(date: Date): { dawn: number; dusk: number } {
  const hour = date.getHours() + date.getMinutes() / 60;
  return { dawn: bump(hour, 5.75, 1.5), dusk: bump(hour, 18.75, 1.5) };
}
