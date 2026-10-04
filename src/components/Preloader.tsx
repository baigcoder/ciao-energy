import React, { useEffect, useRef, useState } from 'react';
import { BRAND } from '../data/brand';
import { getProductThumbUrl } from '../data/products';

interface PreloaderProps {
  isReady: boolean;
  onDone: () => void;
  /** Fires when the loader starts to fade: the moment the scene's intro begins. */
  onLeave?: () => void;
  /** Shortest time the loader stays (the opening needs about three seconds). */
  minDurationMs: number;
  /** True when the 3D opening plays behind the loader: the overlay is then see-through. */
  showStage: boolean;
}

/**
 * Black screen. While the scene's opening plays behind it (a can cracking open, mist rolling out),
 * the wordmark forms in brushed silver as progress completes, with a hairline bar and a zero-padded
 * percentage. On exit the wordmark lifts away and the scene carries on. Fill is a CSS variable.
 */
export const Preloader: React.FC<PreloaderProps> = ({ isReady, onDone, onLeave, minDurationMs, showStage }) => {
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
      const canFinish = readyRef.current && elapsed > minDurationMs;
      const target = canFinish ? 100 : Math.min(90, (elapsed / minDurationMs) * 90);
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
      if (readyRef.current && performance.now() - startedAt.current > minDurationMs * 2) {
        setPercent(100);
        setPhase((current) => (current === 'loading' ? 'leaving' : current));
      }
    }, 500);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(fallback);
    };
  }, [minDurationMs]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    onLeave?.();
    const timer = window.setTimeout(() => {
      setPhase('done');
      onDone();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [phase, onDone, onLeave]);

  // Tell the page a loader is up so the hero chrome stays hidden behind the see-through opening.
  useEffect(() => {
    if (phase !== 'loading') return;
    document.documentElement.dataset.loading = 'true';
    return () => {
      delete document.documentElement.dataset.loading;
    };
  }, [phase]);

  if (phase === 'done') return null;

  const fill = percent / 100;
  return (
    <div
      className={`loader ${phase === 'leaving' ? 'is-leaving' : ''} ${showStage ? 'loader--stage' : ''}`}
      style={{ '--loader-fill': fill } as React.CSSProperties}
      role="progressbar"
      aria-label={`Loading ${BRAND.name}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      {/* First paint: the night and a still can, so the screen is never empty while the 3D loads. */}
      <span className={`loader__still ${showStage && isReady ? 'is-hidden' : ''}`} aria-hidden="true">
        <img src={getProductThumbUrl({ slug: 'blue-raspberry' })} alt="" width={187} height={491} />
      </span>
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
