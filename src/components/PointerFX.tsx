import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useSmoothScroll';

interface PointerFXProps {
  /** Phone tilt, normalised to -1..1 on each axis (sent to the 3D scene). */
  onTilt?: (x: number, y: number) => void;
}

const INTERACTIVE = 'a, button, [role="slider"], input, select, textarea, label, summary';
const MAGNETIC = '.button-primary, .button-outline, .hero-arrow';
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 10; // px

/**
 * Pointer layer: a ring that trails the native cursor (the cursor itself stays,
 * so precision and accessibility are unchanged), magnetic buttons with a light
 * sheen that follows the pointer, and phone tilt for the 3D scene.
 * All transforms are written in one rAF loop; nothing re-renders React.
 * Skipped for reduced motion; the ring only appears for fine pointers.
 */
export const PointerFX: React.FC<PointerFXProps> = ({ onTilt }) => {
  const ringRef = useRef<HTMLDivElement>(null);
  const onTiltRef = useRef(onTilt);
  onTiltRef.current = onTilt;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const ring = ringRef.current;
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let frame = 0;
    let magnet: HTMLElement | null = null;
    // The ring only accompanies a moving pointer: it fades when the mouse rests or leaves.
    let idleTimer = 0;
    const IDLE_MS = 1200;

    const release = () => {
      if (!magnet) return;
      magnet.style.removeProperty('--magnet-x');
      magnet.style.removeProperty('--magnet-y');
      magnet.classList.remove('is-magnetised');
      magnet = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      const element = event.target instanceof Element ? event.target : null;
      ring?.classList.toggle('is-hover', Boolean(element?.closest(INTERACTIVE)));
      ring?.classList.add('is-visible');
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => ring?.classList.remove('is-visible'), IDLE_MS);

      const next = element?.closest<HTMLElement>(MAGNETIC) ?? null;
      if (next !== magnet) release();
      if (next && !next.matches(':disabled')) {
        magnet = next;
        const rect = next.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const clamp = (value: number) => Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, value * MAGNET_PULL));
        next.style.setProperty('--magnet-x', `${clamp(dx).toFixed(1)}px`);
        next.style.setProperty('--magnet-y', `${clamp(dy).toFixed(1)}px`);
        next.style.setProperty('--sheen-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(0)}%`);
        next.classList.add('is-magnetised');
      }
    };
    const onLeave = () => {
      window.clearTimeout(idleTimer);
      ring?.classList.remove('is-visible');
      release();
    };
    const onOut = (event: MouseEvent) => {
      if (!event.relatedTarget) onLeave();
    };
    const onDown = () => ring?.classList.add('is-pressed');
    const onUp = () => ring?.classList.remove('is-pressed');

    const tick = () => {
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      if (ring) ring.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      document.addEventListener('mouseout', onOut);
      window.addEventListener('blur', onLeave);
      frame = requestAnimationFrame(tick);
    }

    // Phone tilt: where the browser exposes orientation without a permission prompt.
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      const x = Math.max(-1, Math.min(1, event.gamma / 30));
      const y = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
      onTiltRef.current?.(x, y);
    };
    const needsPermission = typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
    if (!fine && !needsPermission && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }
    // iOS asks first: the request must come from a tap, so it rides on the visitor's first touch.
    const askTilt = () => {
      const request = (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission;
      request()
        .then((state) => {
          if (state === 'granted') window.addEventListener('deviceorientation', onOrientation, { passive: true });
        })
        .catch(() => {
          // declined or unavailable: the can simply stays still
        });
    };
    if (!fine && needsPermission) window.addEventListener('touchend', askTilt, { once: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      release();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('blur', onLeave);
      window.clearTimeout(idleTimer);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('touchend', askTilt);
    };
  }, []);

  return <div ref={ringRef} className="cursor-ring" aria-hidden="true" />;
};
