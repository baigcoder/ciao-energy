import { describe, expect, it } from 'vitest';
import { pickQuality } from '../webgl/devicePower';

const base = { width: 1920, cores: 12, memoryGb: 16, dataSaver: false, reducedMotion: false };

describe('render tier', () => {
  it('gives capable desktops the full tier', () => {
    expect(pickQuality(base)).toBe('HIGH');
  });

  it('keeps phones and mid-range machines on the middle tier', () => {
    expect(pickQuality({ ...base, width: 390, cores: 8, memoryGb: 8 })).toBe('MEDIUM');
    expect(pickQuality({ ...base, cores: 4 })).toBe('MEDIUM');
    expect(pickQuality({ ...base, memoryGb: 4 })).toBe('MEDIUM');
  });

  it('reduced motion uses the middle tier (no intro, spin or tilt; no bloom)', () => {
    expect(pickQuality({ ...base, reducedMotion: true })).toBe('MEDIUM');
  });

  it('puts known-weak devices and data saver on the cheap, stable tier', () => {
    expect(pickQuality({ ...base, dataSaver: true })).toBe('LOW');
    expect(pickQuality({ ...base, memoryGb: 2 })).toBe('LOW');
    expect(pickQuality({ ...base, cores: 2 })).toBe('LOW');
  });

  it('never pushes a device down because a signal is unknown', () => {
    expect(pickQuality({ width: 1920, cores: 0, dataSaver: false, reducedMotion: false })).toBe('HIGH');
    expect(pickQuality({ width: 1920, cores: 8, memoryGb: undefined, dataSaver: false, reducedMotion: false })).toBe('HIGH');
  });
});
