import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Snap from 'lenis/snap';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lenis smooth scrolling (native scroll position, so anchors, keyboard and
 * assistive tech keep working). Inertial (lerp) rather than fixed-duration, so a
 * flick glides and slows like a physical page. A light snap only settles a page
 * that comes to rest very near a chapter start, after a pause, so it never grabs
 * the scroll mid-gesture. Disabled under prefers-reduced-motion.
 */
export function useSmoothScroll(enabled: boolean, snapSelector?: string) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.3, smoothWheel: true });
    lenisRef.current = lenis;
    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    let snap: Snap | null = null;
    if (snapSelector) {
      snap = new Snap(lenis, {
        type: 'proximity',
        distanceThreshold: '14%',
        duration: 1.2,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
        debounce: 320,
      });
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
