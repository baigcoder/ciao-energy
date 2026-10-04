import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Snap from 'lenis/snap';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lenis smooth scrolling (native scroll position, so anchors, keyboard and
 * assistive tech keep working) with gentle proximity snapping to the starts of
 * full-screen sections, like the reference. Disabled under prefers-reduced-motion.
 */
export function useSmoothScroll(enabled: boolean, snapSelector?: string) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenisRef.current = lenis;
    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    let snap: Snap | null = null;
    if (snapSelector) {
      snap = new Snap(lenis, { type: 'proximity', distanceThreshold: '35%', duration: 0.9, debounce: 120 });
      snap.addElements(Array.from(document.querySelectorAll<HTMLElement>(snapSelector)), { align: 'start' });
    }
    return () => {
      cancelAnimationFrame(frame);
      snap?.destroy();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, snapSelector]);

  /** Scrolls to an element, smoothly when Lenis is active. */
  const scrollToElement = (element: HTMLElement) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(element, { duration: 1.4 });
    } else {
      element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  return { lenisRef, scrollToElement };
}
