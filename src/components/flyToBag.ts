import { prefersReducedMotion } from '../hooks/useSmoothScroll';

/**
 * A small can arcs from the Add button to the header bag, then the bag pulses
 * (the header handles the pulse when the count rises). Skipped under reduced motion.
 */
export function flyToBag(imageUrl: string, from: HTMLElement) {
  if (prefersReducedMotion()) return;
  const target = document.querySelector<HTMLElement>('.bag-toggle');
  if (!target) return;
  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
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
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.35 - 120}px)) scale(0.8) rotate(-20deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25) rotate(-35deg)`, opacity: 0.2 },
    ],
    { duration: 800, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }
  );
  animation.onfinish = () => can.remove();
  animation.oncancel = () => can.remove();
}
