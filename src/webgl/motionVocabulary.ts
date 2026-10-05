/**
 * The scene's motion vocabulary: five roles, each a frame-independent damping rate (per second; higher is snappier).
 * Every eased value in the scene picks one of these, so the whole page moves with the same hand, and a change of feel
 * is a one-line edit. CSS uses the matching duration tokens (src/styles/tokens.css: --motion-instant / -fast / -slow).
 *
 *   REVEAL      something fades or settles into view (effects, tints)          slow, soft
 *   FOCUS       the scene answers the person: pointer, hover                   immediate
 *   TRANSITION  the story moves with the scroll, a beat behind it              medium
 *   EMPHASIZE   light shifts attention (benefit glow)                          unhurried, physical
 *   REST        nothing moves: ambient loops stop, reduced motion lives here   0
 */
export const MOTION_RATE = {
  reveal: 4,
  focus: 12,
  transition: 9,
  emphasize: 6,
  /** The featured can travelling between pages. */
  settle: 3.6,
  rest: 0,
} as const;

/** Exponential damping factor for one frame: 1 - e^(-rate * delta). The same feel at 30, 60 or 144 fps. */
export const damp = (rate: number, delta: number): number => 1 - Math.exp(-rate * delta);
