import React, { useEffect, useRef, useState } from 'react';
import { BRAND } from '../data/brand';

interface PreloaderProps {
  isReady: boolean;
  onDone: () => void;
  /** Fires when the loader starts to fade: the moment the scene's intro begins. */
  onLeave?: () => void;
}

const MIN_DURATION_MS = 1400;

/**
 * Black screen with the wordmark filling with liquid light from the bottom (a
 * glowing level line rides the fill edge), "ENERGY" in the flavor accent, a
 * hairline progress bar and a zero-padded percentage. On exit two black panels
 * part to reveal the scene. Fill is a CSS variable (clip-path, no layout work).
 */
export const Preloader: React.FC<PreloaderProps> = ({ isReady, onDone, onLeave }) => {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>('loading');
  const startedAt = useRef(performance.now());
  const readyRef = useRef(isReady);
  readyRef.current = isReady;

  useEffect(() => {
    let frame = 0;
    let value = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      const canFinish = readyRef.current && elapsed > MIN_DURATION_MS;
      const target = canFinish ? 100 : Math.min(90, (elapsed / MIN_DURATION_MS) * 90);
      value += (target - value) * (canFinish ? 0.12 : 0.08);
      const rounded = Math.min(100, Math.round(value + (canFinish && value > 99.4 ? 1 : 0)));
      setPercent((previous) => (previous === rounded ? previous : rounded));
      if (rounded >= 100) {
        setPhase('leaving');
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Background tabs throttle animation frames: never let the loader outlive its job.
    const fallback = window.setInterval(() => {
      if (readyRef.current && performance.now() - startedAt.current > MIN_DURATION_MS * 2) {
        setPercent(100);
        setPhase((current) => (current === 'loading' ? 'leaving' : current));
      }
    }, 500);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(fallback);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'leaving') return;
    onLeave?.();
    const timer = window.setTimeout(() => {
      setPhase('done');
      onDone();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [phase, onDone, onLeave]);

  if (phase === 'done') return null;

  const fill = percent / 100;
  return (
    <div
      className={`loader ${phase === 'leaving' ? 'is-leaving' : ''}`}
      style={{ '--loader-fill': fill } as React.CSSProperties}
      role="progressbar"
      aria-label={`Loading ${BRAND.name}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span className="loader__panel loader__panel--top" aria-hidden="true" />
      <span className="loader__panel loader__panel--bottom" aria-hidden="true" />
      <span className="loader__glow" aria-hidden="true" />
      <div className="loader__stage" aria-hidden="true">
        <span className="loader__word">
          <span className="loader__word-base">{BRAND.wordmark[0]}</span>
          <span className="loader__word-fill">{BRAND.wordmark[0]}</span>
          <span className="loader__word-edge" />
        </span>
        <span className="loader__sub">{BRAND.wordmark[1]}</span>
        <span className="loader__bar">
          <span className="loader__bar-fill" />
        </span>
        <span className="loader__meta">
          <span className="loader__tagline">{BRAND.tagline}</span>
          <span className="loader__percent">{String(percent).padStart(3, '0')}<span className="loader__percent-sign">%</span></span>
        </span>
      </div>
    </div>
  );
};
