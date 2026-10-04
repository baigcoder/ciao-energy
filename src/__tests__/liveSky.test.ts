import { describe, expect, it } from 'vitest';
import { moonIllumination, moonPhase, twilight } from '../webgl/liveSky';

describe('live sky', () => {
  it('matches known moon phases', () => {
    // Full moon 2024-01-25 17:54 UTC, new moon 2024-02-09 22:59 UTC.
    expect(moonPhase(new Date(Date.UTC(2024, 0, 25, 17, 54)))).toBeCloseTo(0.5, 1);
    const atNew = moonPhase(new Date(Date.UTC(2024, 1, 9, 22, 59)));
    expect(Math.min(atNew, 1 - atNew)).toBeLessThan(0.03);
    expect(moonIllumination(0.5)).toBeCloseTo(1, 5);
    expect(moonIllumination(0)).toBeCloseTo(0, 5);
  });

  it('is night (no twilight) at midnight and midday, and peaks at dawn and dusk', () => {
    const at = (h: number, m = 0) => twilight(new Date(2026, 9, 4, h, m));
    expect(at(0)).toEqual({ dawn: 0, dusk: 0 });
    expect(at(12)).toEqual({ dawn: 0, dusk: 0 });
    expect(at(5, 45).dawn).toBeCloseTo(1, 5);
    expect(at(18, 45).dusk).toBeCloseTo(1, 5);
  });
});
