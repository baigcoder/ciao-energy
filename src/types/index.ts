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
  answer: string;
}

export type QualityPreset = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';

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
  wave: number;
  swirl: number;
  baseOffset: number;
  lightIntensity: number;
  lightWidth: number;
  tintStrength: number;
  spotIntensity: number;
  spotY: number;
  pointerInfluence: number;
  swipeSpeed: number;
  /** 0 = printed label lit normally, 1 = label dark (benefit chapters). */
  labelDim: number;
}
