import { prefersReducedMotion } from '../hooks/useSmoothScroll';

/**
 * A small can arcs from one element to another (the Add button to the header bag, a flavor into a pack slot).
 * `endScale` is the can's size on arrival; `fade` lets it vanish into the target. Skipped under reduced motion.
 */
export function flyBetween(imageUrl: string, from: HTMLElement, to: HTMLElement, options: { duration?: number; endScale?: number; fade?: boolean; lift?: number } = {}) {
  if (prefersReducedMotion()) return;
  const { duration = 800, endScale = 0.25, fade = true, lift = 120 } = options;
  const start = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();
  const can = document.createElement('img');
  can.src = imageUrl;
  can.alt = '';
  can.className = 'fly-can';
  can.style.left = `${start.left + start.width / 2}px`;
  can.style.top = `${start.top + start.height / 2}px`;
  document.body.appendChild(can);
  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  const animation = can.animate(
    [
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.35 - lift}px)) scale(${(1 + endScale) / 2 + 0.15}) rotate(-20deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale}) rotate(-35deg)`, opacity: fade ? 0.2 : 1 },
    ],
    { duration, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }
  );
  animation.onfinish = () => can.remove();
  animation.oncancel = () => can.remove();
}

/** The Add button's can arcs to the header bag, then the bag pulses (the header handles the pulse). */
export function flyToBag(imageUrl: string, from: HTMLElement) {
  const target = document.querySelector<HTMLElement>('.bag-toggle');
  if (!target) return;
  flyBetween(imageUrl, from, target);
}
