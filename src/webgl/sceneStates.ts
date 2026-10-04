import { CAROUSEL_CONFIG } from './sceneManagerConfig';
import { LABEL } from '../data/brand';

export type SceneMode = 'hero-carousel' | 'feature-editorial' | 'range';

export interface SceneStateConfig {
  camera: {
    posX: number;
    posY: number;
    posZ: number;
    fov: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
  product: {
    scale: number;
    posX: number;
    posY: number;
    posZ: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    spin: number;
  };
  lighting: {
    lightIntensity: number;
    tintStrength: number;
    spotIntensity: number;
    spotY: number;
    pointerInfluence: number;
    /** Benefit chapters darken the printed label so only the glowing block reads. */
    labelDim?: number;
  };
  spacing: number;
  /** 1 = hero ring, 0 = single featured can. */
  wave: number;
  /** 1 = diagonal lineup of every can. */
  swirl: number;
  baseOffset: number;
}

const DEG = Math.PI / 180;

/**
 * Single camera for the whole page (z 29, fov 20): at 1920×920, one world unit at
 * z = 0 is ≈ 90 px, so poses below are measured straight from the references.
 */
const CAMERA = { posX: 0, posY: 0, posZ: 29, fov: 20, rotX: 0, rotY: 0, rotZ: 0 };

const LIGHT = { lightIntensity: 1, tintStrength: 1, spotIntensity: 0, spotY: 3, pointerInfluence: 0.15 };

/**
 * Benefit poses come from the label layout: the can turns so the right panel's
 * centre faces the camera (u = 0.5 faces it at rotY 0, u grows to the right), and
 * moves vertically so the active block sits at the same screen height each time.
 */
const BENEFIT_SCALE = 2.85; // can ≈110% of the viewport height: the label fills the middle of the screen
const SHELL_HEIGHT = 3.88; // can.glb label shell height at scale 1
const BLOCK_SCREEN_Y = 0.1; // world Y where the active block is held (screen middle)
const panelCentreU = (LABEL.panels.right[0] + LABEL.panels.right[1]) / 2;
const BENEFIT_ROT_Y = (0.5 - panelCentreU) * Math.PI * 2;

const benefit = (index: number, rotZ: number): SceneStateConfig => {
  const [, v0, , v1] = LABEL.benefitBlocks[index];
  const posY = BLOCK_SCREEN_Y - ((v0 + v1) / 2 - 0.5) * SHELL_HEIGHT * BENEFIT_SCALE;
  return benefitPose(posY, rotZ);
};

const benefitPose = (posY: number, rotZ: number): SceneStateConfig => ({
  camera: CAMERA,
  product: { scale: BENEFIT_SCALE, posX: 0.9, posY, posZ: 0, rotX: 7 * DEG, rotY: BENEFIT_ROT_Y, rotZ, spin: 0 },
  lighting: { ...LIGHT, pointerInfluence: 0, labelDim: 1 },
  spacing: CAROUSEL_CONFIG.spacing,
  wave: 0,
  swirl: 0,
  baseOffset: 14,
});

export const SCENE_STATES: Record<string, SceneStateConfig> = {
  // Hero: ring of cans, the focused one ~50% of the viewport height.
  hero: {
    camera: CAMERA,
    product: {
      scale: CAROUSEL_CONFIG.heroScale,
      posX: 0,
      posY: CAROUSEL_CONFIG.yBase,
      posZ: 0,
      rotX: CAROUSEL_CONFIG.pitchX,
      rotY: CAROUSEL_CONFIG.yawHeroY,
      rotZ: CAROUSEL_CONFIG.rollZ,
      spin: 0,
    },
    lighting: LIGHT,
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 1,
    swirl: 0,
    baseOffset: 3,
  },

  // Flavor intro: big can leaning ~18°, right of the copy; the whole can stays in frame.
  profile: {
    camera: CAMERA,
    product: { scale: 1.5, posX: 1.4, posY: -0.45, posZ: 0, rotX: 8 * DEG, rotY: 0.32, rotZ: 18 * DEG, spin: 0 },
    lighting: { ...LIGHT, pointerInfluence: 0.12 },
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 0,
    swirl: 0,
    baseOffset: 14,
  },

  // Benefits: back panel to camera; the can steps up so the active block stays mid-screen.
  benefit01: benefit(0, 7 * DEG),
  benefit02: benefit(1, 6 * DEG),
  benefit03: benefit(2, 5 * DEG),
  benefit04: benefit(3, 5 * DEG),

  // Zero Bullshit: upright can in front of the giant headline.
  argument: {
    camera: CAMERA,
    product: { scale: 1.55, posX: 0, posY: 0, posZ: 0, rotX: 6 * DEG, rotY: 0.26, rotZ: 6 * DEG, spin: 0 },
    lighting: LIGHT,
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 0,
    swirl: 0,
    baseOffset: 14,
  },

  // Lineup: every can in one rising diagonal row.
  range: {
    camera: CAMERA,
    product: { scale: 1.2, posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, spin: 0 },
    lighting: { ...LIGHT, pointerInfluence: 0 },
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 0,
    swirl: 1,
    baseOffset: 20,
  },

  // FAQ: the lineup rises fully out of the frame (no can rests under the header).
  faq: {
    camera: { ...CAMERA, posY: -13 },
    product: { scale: 1.2, posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, spin: 0 },
    lighting: { ...LIGHT, pointerInfluence: 0 },
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 0,
    swirl: 1,
    baseOffset: 20,
  },

  // Newsletter / footer: scene clears.
  newsletter: {
    camera: { ...CAMERA, posY: -16 },
    product: { scale: 1.2, posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, spin: 0 },
    lighting: { ...LIGHT, pointerInfluence: 0 },
    spacing: CAROUSEL_CONFIG.spacing,
    wave: 0,
    swirl: 1,
    baseOffset: 20,
  },
};

/**
 * One source of truth for the home scroll story: each DOM section id maps to a
 * scene state. Waypoint k sits at timeline progress k / (n - 1).
 */
export const SCENE_SEQUENCE: ReadonlyArray<{ sectionId: string; state: keyof typeof SCENE_STATES }> = [
  { sectionId: 'gamme', state: 'hero' },
  { sectionId: 'profile', state: 'profile' },
  { sectionId: 'benefits-1', state: 'benefit01' },
  { sectionId: 'benefits-2', state: 'benefit02' },
  { sectionId: 'benefits-3', state: 'benefit03' },
  { sectionId: 'benefits-4', state: 'benefit04' },
  { sectionId: 'argument', state: 'argument' },
  { sectionId: 'full-gamme', state: 'range' },
  { sectionId: 'FAQ', state: 'faq' },
  { sectionId: 'newsletter', state: 'newsletter' },
];
