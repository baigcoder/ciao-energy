/**
 * Hero carousel ring at 1920×920, matched to the reference product wall: about eleven slim cans
 * across the frame, close together, the centre can only a little larger than its neighbours. The
 * ring is tilted: cans dip below the centre on the left, rise above it on the right, and curve back
 * toward the middle at both edges as the ring turns away (flavors repeat, as on the shelf).
 */
export const CAROUSEL_CONFIG = {
  spacing: 2.3,          // arc length between cans: about half a can of air between neighbours
  spacingMobile: 2.6,
  ringRadius: 22,        // a wide ring: runs to the frame edges, the outermost cans a little smaller
  ringRadiusMobile: 10,
  ringArc: 0,            // desktop height comes from the tilted ring (ringWave) instead
  ringArcMobile: 0.09,   // phones: outer cans rise slightly (squared with the slot distance)
  ringWave: 1.05,        // tilted ring: height swing (world units) of the cans either side of centre
  ringWaveMobile: 0.35,
  ringWaveSlots: 5,      // slots from the centre to where the ring turns back level (its edge)
  visibleSlots: 5,       // eleven cans across the frame on desktop; the outermost fade into the frame edge
  visibleSlotsMobile: 1.35,
  heroScale: 0.94,       // ≈44% of the viewport height when the space allows
  heroScaleMobile: 1.6,
  neighbourScale: 0.74,  // neighbours relative to the centre can
  heroLift: 1.4,         // focused can steps toward the camera
  yBase: 0.1,
  pitchX: -0.2,          // focused can: bottom toward camera, underside ellipse visible
  pitchNeighbour: -0.06, // neighbours stand closer to upright
  yawHeroY: -0.35,       // logo turned toward camera
  rollZ: 0.16,           // focused can leans left
  neighbourLean: 0.3,    // neighbours lean toward the centre
  labelTurn: -1.9,       // each neighbour shows a different side of its label
};
