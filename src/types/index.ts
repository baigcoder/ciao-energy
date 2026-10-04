export interface FlavorTheme {
  primary: string;       // Background deep hue
  secondary: string;     // Accent glow / rim hue
  accent: string;
}

export interface Flavor {
  id: string;
  index: number;
  name: string;
  line1: string;
  line2: string;
  description: string;
  theme: FlavorTheme;
  /** Accent token name (maps to --color-flavor-<token>). */
  accentToken: string;
  /** Flat label albedo and its surface map (G roughness, B metalness). */
  textureUrl: string;
  surfaceUrl: string;
  /** False while the front panel is the temporary type-only version. */
  hasFrontArt: boolean;
}

export type BenefitIconType = 'caffeine' | 'electrolytes' | 'vitamins' | 'zamzam';

export interface Benefit {
  id: string;
  chapter: number;
  /** Short spec shown in the tag above the title (e.g. "From sea salt"). */
  spec: string;
  title: string;
  titleLine1: string;
  titleLine2?: string;
  description: string;
  iconType: BenefitIconType;
}

export interface FAQItem {
  id: string;
  question: string;
  /** Public answer text; a neutral line while the fact is still being confirmed. */
  answer: string;
  /** True while the answer is unconfirmed: shown in the list, left out of structured data. */
  pending: boolean;
}

export type QualityPreset = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';

/** Animated scene values: the master timeline tweens one of these objects between section states. */
export interface Scene3DData {
  camPosX: number;
  camPosY: number;
  camPosZ: number;
  camRotX: number;
  camRotY: number;
  camRotZ: number;
  fov: number;
  canScale: number;
  canPosX: number;
  canPosY: number;
  canPosZ: number;
  canRotX: number;
  canRotY: number;
  canRotZ: number;
  canSpin: number;
  spacing: number;
  /** 1 = hero ring, 0 = single featured can. */
  wave: number;
  /** 1 = the finale lineup of every can. */
  swirl: number;
  pointerInfluence: number;
  /** 0 = printed label lit normally, 1 = label dark (benefit chapters). */
  labelDim: number;
  /** World Y of the wet floor under the cans (reflections and mist sit here). */
  floorY: number;
  /** 0..1 strength of the mirrored floor reflection. */
  reflect: number;
  /** Stage: ridge-line mountains, moon glow, foreground mist, accent glow pool, stars (0..1). */
  mountains: number;
  moon: number;
  mistFg: number;
  glow: number;
  stars: number;
  /** 0 night stage, 1 full-bleed flavor colour field (the flavor chapters). */
  field: number;
}
