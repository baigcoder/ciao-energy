/**
 * Hero carousel ring at 1920×920: the focused can is ~50% of the viewport height
 * and stands over the pedestal. Two neighbours per side sit on a shallow,
 * symmetric arc, stepping back into the dark; cans beyond that fade out, so
 * nothing overlaps and no flavor shows twice.
 */
export const CAROUSEL_CONFIG = {
  spacing: 2.1,          // arc length between cans: neighbours tuck slightly behind the centre can
  spacingMobile: 2.6,
  ringRadius: 11,        // tighter ring: neighbours step back in depth
  ringRadiusMobile: 10,
  ringArc: 0.09,         // outer cans rise slightly (squared with the slot distance)
  visibleSlots: 2.5,     // five cans on desktop (centre ± 2): with six flavors, slot ±3 would show one flavor twice
  visibleSlotsMobile: 1.35,
  heroScale: 1.45,       // ≈55% of the viewport height when the space allows
  heroScaleMobile: 1.6,
  heroLift: 1.4,         // focused can steps toward the camera
  yBase: 0.1,
  pitchX: -0.2,          // focused can: bottom toward camera, underside ellipse visible
  pitchNeighbour: -0.06, // neighbours stand closer to upright
  yawHeroY: -0.35,       // logo turned toward camera
  rollZ: 0.16,           // focused can leans left
  neighbourLean: 0.3,    // neighbours lean toward the centre
  labelTurn: -1.9,       // each neighbour shows a different side of its label
};
