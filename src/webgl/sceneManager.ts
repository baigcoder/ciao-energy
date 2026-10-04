import * as THREE from 'three';
import gsap from 'gsap';
import { FLAVORS } from '../data/flavors';
import { LABEL } from '../data/brand';
import { audioManager } from '../audio/audioManager';
import { createCanMesh, condensation, disposeCanMaterials, getCanSurface, setCanFocus, setCanAccent } from './canModel';
import { disposeCanGeometry } from './canGeometry';
import { LabelTextures } from './labelTextures';
import { createStudioEnvironment } from './studioEnv';
import { Stage, type StageParams } from './stage';
import { PostFx } from './post';
import { FloorReflections } from './reflections';
import { Scene3DData } from '../types';
import { CAROUSEL_CONFIG } from './sceneManagerConfig';
import { SCENE_SEQUENCE, SCENE_STATES, SceneMode, SceneStateConfig } from './sceneStates';
import type { SceneMoment } from './moments/types';
import { RoarMoment } from './moments/roar';
import { OpeningMoment } from './moments/opening';
import { GhostText } from './moments/ghostText';
import { FruitField } from './moments/fruitField';
import { InsideCan } from './moments/insideCan';
import { ZamzamPool } from './moments/zamzamPool';
import { IceDust } from './moments/iceDust';
import { moonPhase, twilight } from './liveSky';
import { FinaleGlow } from './moments/finaleGlow';

export { CAROUSEL_CONFIG };
export type { SceneMode, SceneStateConfig };

/** UV rects (u0, v0, u1, v1) of the four benefit blocks on the label's side panel (grizzly.json). */
const BENEFIT_GLOW_RECTS = LABEL.benefitBlocks.map(([u0, v0, u1, v1]) => new THREE.Vector4(u0, v0, u1, v1));

/** Product page framing (same lens as the home scene). */
const PRODUCT_CAMERA = { x: 0, y: 0, z: 29, fov: 20 };
// Whole can in the left column, lid to base with breathing room; a gentle, premium lean.
const PRODUCT_POSE = { x: -3.3, y: 0.2, z: 0, scale: 1.6, rotX: 0.08, rotY: 0.3, rotZ: 0.11 };
const PRODUCT_POSE_NARROW = { x: 0, y: 1.6, z: 0, scale: 1.1, rotX: 0.08, rotY: 0.3, rotZ: 0.14 };

const CAN_COUNT = 12;
const wrap = (value: number, min: number, max: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};
const smooth = (t: number) => t * t * (3 - 2 * t);

export type QualityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export class SceneManager {
  public currentMode: SceneMode = 'hero-carousel';
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  public cans: THREE.Group[] = [];
  public keyLight!: THREE.DirectionalLight;
  public rimLight!: THREE.DirectionalLight;
  public fillLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  /** Lights the domed can bottoms seen in the hero ring; dimmed elsewhere so the base rim never glares. */
  private baseFill!: THREE.DirectionalLight;
  /** One-off strobe (the roar, flavor glint). */
  public flashLight!: THREE.DirectionalLight;

  private labels!: LabelTextures;
  private stage!: Stage;
  private post: PostFx | null = null;
  private reflections: FloorReflections | null = null;
  public moments: SceneMoment[] = [];
  private roarMoment!: RoarMoment;
  private openingMoment!: OpeningMoment;
  private fruit!: FruitField;

  /** Stage parameters, rewritten every frame; moments may add to them before rendering. */
  public readonly stageParams: StageParams = {
    time: 0,
    aspect: 1,
    horizon: 0.4,
    camX: 0,
    camY: 0,
    scroll: 0,
    accent: new THREE.Color(),
    accentPrev: new THREE.Color(),
    wipe: 1,
    wipeOrigin: new THREE.Vector2(0.5, 0.5),
    moon: 1,
    field: 0,
    studio: 0,
    moonPhase: 0.5,
    dawn: 0,
    dusk: 0,
    mountains: 1,
    mist: 1,
    mistFg: 0.6,
    burst: 0,
    burstPos: new THREE.Vector2(0.5, 0.5),
    water: 0,
    flash: 0,
    glow: 1,
    glowPos: new THREE.Vector2(0.5, 0.4),
    stars: 1,
  };
  /** Camera offsets added by moments (shake, push) after the timeline pose. */
  public readonly cameraOffset = new THREE.Vector3();
  public cameraRollOffset = 0;
  /** Per-frame effects set by moments (reset to zero at the start of every frame). */
  public readonly fx = { flash: 0, burst: 0, water: 0, burstPos: new THREE.Vector2(0.5, 0.5) };
  /**
   * A moment may take over one can's pose: `blend` mixes the layout pose toward this pose
   * (position, Euler rotation, uniform scale). Used by the opening to hold the can close to the camera.
   */
  public readonly canOverride = { index: -1, blend: 0, position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: 1 };
  private readonly overrideEuler = new THREE.Euler();

  // Pointer position projected to world space at z=0 (hover proximity)
  private pointerLightTarget = { x: 0, y: 0, z: 4 };

  // Benefit label glow (one block at a time, damped in the render loop)
  private benefitGlowIndex = -1;
  private benefitGlowStrength = 0;
  private readonly glowColor = new THREE.Color();
  private readonly rimBase = new THREE.Color(0xdfe6ff);
  private readonly rimTint = new THREE.Color();

  // Per-can hover proximity state (smooth damped, outside React render)
  private canHoverInfluence: Float32Array = new Float32Array(0);
  private canIdlePhase: Float32Array = new Float32Array(0);
  private lastHoverAudioTime = 0;
  private lastHoveredCanIndex = -1;

  // Direct canvas pointer interaction & raycasting
  public onHeroCanClicked?: () => void;
  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();
  private isPointerDown = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastDragX = 0;

  // State
  public isLowPower = false;
  public quality: QualityLevel = 'HIGH';
  public contextLost = false;
  public isRunning = true;
  private reqId: number | null = null;
  private lastTime = 0;
  private carouselVelocity = 0;
  private pixelRatioCap = 1.5;

  public carousel = {
    spacing: CAROUSEL_CONFIG.spacing,
    target: 0,
    position: 0,
    index: 0,
    lastIndex: 0,
    getRounded: () => Math.round(this.carousel.target / this.carousel.spacing) * this.carousel.spacing,
    getIndex: (wrapped = true) => {
      const idx = Math.round(this.carousel.position / this.carousel.spacing);
      if (wrapped) {
        const count = FLAVORS.length;
        return ((idx % count) + count) % count;
      }
      return idx;
    },
    goTo: (index: number) => {
      const count = FLAVORS.length;
      const current = Math.round(this.carousel.target / this.carousel.spacing);
      const currentWrapped = ((current % count) + count) % count;
      let delta = ((index % count) + count) % count - currentWrapped;
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      this.carousel.target = (current + delta) * this.carousel.spacing;
    },
    previous: () => {
      this.carousel.target -= this.carousel.spacing;
    },
    next: () => {
      this.carousel.target += this.carousel.spacing;
    },
    listeners: new Set<(e: { index: number; previous: number }) => void>(),
    onChanged: (cb: (e: { index: number; previous: number }) => void) => {
      this.carousel.listeners.add(cb);
      return () => this.carousel.listeners.delete(cb);
    },
  };

  public pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  private readonly windVector = new THREE.Vector2();

  /** Pointer offset from the screen centre as a gentle wind (world units); zero for reduced motion. */
  public pointerWind(): THREE.Vector2 {
    if (this.reducedMotion) return this.windVector.set(0, 0);
    return this.windVector.set(this.pointer.smoothX / Math.max(window.innerWidth, 1), -this.pointer.smoothY / Math.max(window.innerHeight, 1));
  }

  /**
   * The master timeline tweens `timelineData`; every frame it is copied into `data`, which moments
   * may adjust for that frame only (so a moment never leaves residue in the timeline).
   */
  private timelineData!: Scene3DData;
  public data: Scene3DData = {
    camPosX: 0, camPosY: 0, camPosZ: 29, camRotX: 0, camRotY: 0, camRotZ: 0, fov: 20,
    canScale: 1.2, canPosX: 0, canPosY: 0, canPosZ: 0, canRotX: 0, canRotY: 0, canRotZ: 0, canSpin: 0,
    spacing: 1, wave: 1, swirl: 0, pointerInfluence: 0.15, labelDim: 0,
    floorY: -3.6, reflect: 1, mountains: 1, moon: 1, mistFg: 0.6, glow: 1, stars: 1, field: 0, studio: 0,
  };

  public routeMode: 'HOME' | 'PRODUCT' | 'PAGE' = 'HOME';
  public activeProductIndex = 0;
  private productScroll = 0;
  /** 0..1 as the product page reaches its end: the pinned can lifts away clear of the footer. */
  private productExit = 0;
  private heroLift = 0;
  /** Hero can scale factor so it fits between the header and the title (≤ 1). */
  private heroFit = 1;
  private govStart = 0;
  private govFrames = 0;
  private govStep = 0;
  public onQualityChange?: (level: QualityLevel) => void;
  private spinStart = -1e9;
  /** Reduced motion: no pointer tilt, no spin, no intro (set from the app). */
  public reducedMotion = false;
  private spinOffset = 0;
  private productCanIndex = 0;
  private routeBlend = 1;
  private hasRenderedHome = false;
  private readonly routeFrom = Array.from({ length: CAN_COUNT }, () => ({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: 0,
  }));
  private readonly routeCameraFrom = new THREE.Vector3(0, 0, 29);
  private readonly tmpVector = new THREE.Vector3();
  private readonly tmpEuler = new THREE.Euler();
  private readonly tmpQuaternion = new THREE.Quaternion();
  public productViewerRotation = { x: 0, y: 0, targetX: 0, targetY: 0 };
  /** Visitor turning the featured can (keys / drag), eased; glides back to the authored pose when idle. */
  private userTurn = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0, lastInput: -1e9 };
  private dragTurn = false;

  // Flavor colour wave: the new accent floods outward from the focused can.
  private accentShown = new THREE.Color();
  private accentFrom = new THREE.Color();
  private accentTo = new THREE.Color();
  private wipeStart = -1e9;
  private lastAccentIndex = -1;

  // Intro: cans rise into the ring after the loader.
  private introArmedAt = -1;
  private introStart = -1e9;
  public onRoar: (() => void) | null = null;

  public masterTimeline!: gsap.core.Timeline;
  private targetTimelineProgress = 0;
  private currentTimelineProgress = 0;
  /** Section position 0..9 (continuous), for the stage's slow drift. */
  public sectionPosition = 0;
  /** Smoothed scroll speed in sections per second (signed): drives can inertia and the ice dust. */
  public scrollVelocity = 0;
  private iceDust: IceDust | null = null;
  private skyCheckedAt = -1e9;
  private lastSectionPosition = 0;

  /** When set, shaders and animation phases use this clock instead of real time (deterministic captures). */
  public timeOverride: number | null = null;
  public readonly focusScreen = new THREE.Vector2(0.5, 0.45);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.isLowPower = width < 1024 || /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
    // up to 2x on every tier for crisp labels; the frame-rate governor steps down on slow GPUs
    this.pixelRatioCap = 2;
    const pixelRatio = Math.min(window.devicePixelRatio, this.pixelRatioCap);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isLowPower,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x02040a, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 29);

    this.scene.environment = createStudioEnvironment(this.renderer);
    this.setupLights();
    this.setupSceneObjects();

    this.quality = this.isLowPower ? 'MEDIUM' : 'HIGH';
    this.stage = new Stage(this.renderer, width, height, this.quality);
    this.scene.add(this.stage.background, this.stage.foreground);
    this.buildPost(width, height, pixelRatio);
    this.reflections = this.isLowPower ? null : new FloorReflections(this.scene, this.cans, this.labels);

    this.buildMasterTimeline();
    this.roarMoment = new RoarMoment(this);
    this.openingMoment = new OpeningMoment(this);
    this.fruit = new FruitField(this);
    this.moments.push(this.openingMoment, this.roarMoment, new GhostText(this), this.fruit, new InsideCan(this), new ZamzamPool(this), new FinaleGlow(this));
    this.iceDust = new IceDust(this);
    this.bindEvents();
    (window as unknown as { __GRIZZLY_SCENE__: SceneManager }).__GRIZZLY_SCENE__ = this;
    this.animate(0);
  }

  // ───────────────────────── setup ─────────────────────────

  /**
   * One cold overhead key follows the focused can so its top rim catches a hot specular; a
   * flavor-tinted back light separates the silhouette. Everything else stays dark.
   */
  private setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0xcfe0ff, 0x07090e, 0.14);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xf2f7ff, 0.6);
    this.keyLight.position.set(-1.6, 6.5, 4.2);
    this.scene.add(this.keyLight, this.keyLight.target);

    // a strong back light draws a bright chrome edge round every silhouette (product-film look)
    this.rimLight = new THREE.DirectionalLight(0xdfe6ff, 2.6);
    this.rimLight.position.set(3.2, 3.5, -5);
    this.scene.add(this.rimLight);

    this.fillLight = new THREE.DirectionalLight(0xe8eef8, 0.18);
    this.fillLight.position.set(2.6, -0.6, 4.0);
    this.scene.add(this.fillLight);

    this.baseFill = new THREE.DirectionalLight(0xdfe4ec, 0.9);
    this.baseFill.position.set(0.5, -6, 3);
    this.scene.add(this.baseFill);

    this.flashLight = new THREE.DirectionalLight(0xffffff, 0);
    this.flashLight.position.set(0, 7, 2);
    this.scene.add(this.flashLight, this.flashLight.target);
  }

  private setupSceneObjects() {
    this.labels = new LabelTextures(this.renderer);
    this.labels.maxLod = this.isLowPower ? 1 : 2;
    this.labels.onChange = (flavorIndex) => this.applyLabelMaps(flavorIndex);

    for (let i = 0; i < CAN_COUNT; i += 1) {
      const maps = this.labels.get(i % FLAVORS.length);
      const can = createCanMesh(maps.albedo, maps.surface, this.isLowPower, this.isLowPower ? null : maps.normal);
      setCanAccent(can, FLAVORS[i % FLAVORS.length].theme.secondary);
      can.visible = false;
      this.cans.push(can);
      this.scene.add(can);
    }
    // First frame: the 1k level of every flavor (≈120 KB each); sharper levels stream in by need.
    FLAVORS.forEach((_, index) => void this.labels.ensureAlbedo(index, 0));

    this.canHoverInfluence = new Float32Array(CAN_COUNT);
    this.canIdlePhase = new Float32Array(CAN_COUNT);
    for (let i = 0; i < CAN_COUNT; i += 1) this.canIdlePhase[i] = Math.random() * Math.PI * 2;
  }

  private buildPost(width: number, height: number, pixelRatio: number) {
    this.post?.dispose();
    this.post = null;
    if (this.quality === 'LOW') return;
    this.post = new PostFx(this.renderer, this.scene, this.camera, width, height, pixelRatio, this.quality);
  }

  /** Re-points every can (and its reflection) at a flavor's current textures. */
  private applyLabelMaps(flavorIndex: number) {
    const maps = this.labels.get(flavorIndex);
    this.cans.forEach((can, i) => {
      if (i % FLAVORS.length !== flavorIndex) return;
      const shell = can.getObjectByName('Shell') as THREE.Mesh | undefined;
      const material = shell?.material as THREE.MeshStandardMaterial | undefined;
      if (!material) return;
      material.map = maps.albedo;
      material.metalnessMap = maps.surface;
      material.roughnessMap = maps.surface;
      if (!this.isLowPower) material.normalMap = maps.normal;
      material.needsUpdate = true;
    });
    this.reflections?.setAlbedo(flavorIndex, maps.albedo);
  }

  /** Streams the sharper label levels for the flavors that matter right now. */
  private lastStreamKey = '';
  private streamLabels(focusFlavor: number, closeUp: boolean) {
    const key = `${focusFlavor}:${closeUp}`;
    if (key === this.lastStreamKey) return;
    this.lastStreamKey = key;
    const count = FLAVORS.length;
    void this.labels.ensureSurface(focusFlavor);
    void this.labels.ensureAlbedo(focusFlavor, 1);
    [1, count - 1].forEach((step) => {
      const neighbour = (focusFlavor + step) % count;
      void this.labels.ensureAlbedo(neighbour, 1);
      void this.labels.ensureSurface(neighbour);
    });
    // the featured can always gets the sharpest label on capable GPUs (hero included, not only close-ups)
    if ((closeUp || this.quality === 'HIGH') && this.labels.maxLod >= 2) void this.labels.ensureAlbedo(focusFlavor, 2);
    // Everything else loads when the browser is idle.
    const idle = () => FLAVORS.forEach((_, index) => void this.labels.ensureAlbedo(index, 1));
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number };
    if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(idle, { timeout: 4000 });
    else window.setTimeout(idle, 2500);
  }

  // ───────────────────────── intro ─────────────────────────

  /** Holds the hero cans below frame until playIntro() (called when the loader leaves). */
  public armIntro(playOpening = true) {
    if (this.reducedMotion) return;
    this.introArmedAt = performance.now();
    this.introStart = Number.POSITIVE_INFINITY;
    if (playOpening) this.openingMoment.arm();
  }

  public playIntro() {
    if (this.introArmedAt < 0) return;
    this.introArmedAt = -1;
    this.introStart = performance.now();
    this.openingMoment.release();
  }

  /** The roar (first scroll of a visit): the bear behind the can, a small camera shake. */
  public roar() {
    this.roarMoment.trigger();
  }

  /** 0 = held below frame, 1 = settled; staggered outward from the centre can. */
  private introProgress(time: number, stepDist: number) {
    if (this.introStart < 0) return 1;
    const local = Math.min(1, Math.max(0, (time - this.introStart - stepDist * 130) / 1250));
    const c = 1.15; // easeOutBack: a small settle past the mark
    return 1 + (c + 1) * (local - 1) ** 3 + c * (local - 1) ** 2;
  }

  /**
   * Keeps the focused hero can clear of the HTML title: given the title's top edge in CSS px,
   * lift the ring until the can's lowest point sits a margin above it.
   */
  public setHeroSafeBottom(titleTopPx: number, headerBottomPx = 0) {
    const height = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const distance = (isMobile ? this.data.camPosZ + 6.5 : this.data.camPosZ) - CAROUSEL_CONFIG.heroLift;
    const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance) / height;
    const marginPx = 14;
    const safeY = (height / 2 - (titleTopPx - marginPx)) * unitsPerPx;
    const baseScale = isMobile ? CAROUSEL_CONFIG.heroScaleMobile : CAROUSEL_CONFIG.heroScale;
    const topY = (height / 2 - (headerBottomPx + marginPx * 0.5)) * unitsPerPx;
    const available = headerBottomPx > 0 ? topY - safeY : Number.POSITIVE_INFINITY;
    this.heroFit = Math.min(1, Math.max(0.6, available / (5.0 * baseScale)));
    const scale = baseScale * this.heroFit;
    const canBottom = CAROUSEL_CONFIG.yBase + (isMobile ? 0.7 : 0) - 2.6 * scale;
    // The hero camera looks slightly up and sits a little low: both move the can down the screen.
    const heroCamera = SCENE_STATES.hero.camera;
    this.heroLift = safeY - canBottom + distance * Math.tan(heroCamera.rotX) + heroCamera.posY;
    if (!isMobile && available !== Number.POSITIVE_INFINITY && available > 5.0 * scale) {
      this.heroLift += (available - 5.0 * scale) * 0.3;
    }
  }

  // ───────────────────────── quality ─────────────────────────

  /**
   * Steps quality down when the device can't hold ~50 fps: pixel ratio first,
   * then bloom, then the low tier. Never steps back up within a visit.
   */
  private governQuality(rawDelta: number, time: number) {
    if (rawDelta <= 0 || rawDelta > 0.5) {
      this.govStart = time;
      this.govFrames = 0;
      return;
    }
    if (!this.govStart) this.govStart = time;
    this.govFrames += 1;
    const elapsed = time - this.govStart;
    if (elapsed < 2000) return;
    const fps = (this.govFrames * 1000) / elapsed;
    this.govStart = time;
    this.govFrames = 0;
    if (time < 4000 || fps >= 50 || this.govStep >= 4) return;
    this.govStep += 1;
    const dpr = Math.min(window.devicePixelRatio || 1, this.pixelRatioCap);
    const ratios = [dpr, dpr * 0.85, Math.min(dpr * 0.75, 1), Math.min(dpr * 0.75, 1), 0.75];
    this.setPixelRatio(ratios[this.govStep]);
    if (this.govStep >= 2) this.stage.refreshEvery = 3;
    if (this.govStep === 3) this.applyQuality('MEDIUM');
    if (this.govStep >= 4) this.applyQuality('LOW');
  }

  private setPixelRatio(ratio: number) {
    this.renderer.setPixelRatio(ratio);
    this.post?.setPixelRatio(ratio);
  }

  private applyQuality(level: QualityLevel) {
    if (this.quality === level) return;
    this.quality = level;
    this.buildPost(window.innerWidth, window.innerHeight, this.renderer.getPixelRatio());
    this.reflections?.setEnabled(level !== 'LOW');
    this.stage.setQuality(level, window.innerWidth, window.innerHeight);
    this.onQualityChange?.(level);
  }

  /** Smart quality (HIGH / MEDIUM / LOW / STATIC) from the app's device probe. */
  public setQuality(level: QualityLevel | 'STATIC') {
    if (level === 'STATIC') {
      this.isRunning = false;
      return;
    }
    this.isRunning = true;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    // HIGH renders up to 2x for crisp labels; the frame-rate governor steps down on slow GPUs
    const cap = level === 'LOW' ? 1 : level === 'MEDIUM' ? 1.25 : 2;
    this.setPixelRatio(Math.min(dpr, cap));
    this.applyQuality(level);
  }

  // ───────────────────────── controls ─────────────────────────

  /** Phone tilt (-1..1) drives the same parallax as the desktop pointer. */
  public setDeviceTilt(x: number, y: number) {
    this.pointer.x = x * 640;
    this.pointer.y = y * 640;
  }

  private tilt() {
    return this.reducedMotion ? 0 : this.data.pointerInfluence * 2;
  }

  /** Lights one benefit block on the featured can's label (-1 turns the glow off). */
  public setBenefitGlow(index: number) {
    this.benefitGlowIndex = index;
  }

  /** Pushes scroll-driven label darkening and the benefit glow into a can's shader. */
  private applyLabelState(can: THREE.Group, isFeatured: boolean) {
    const surface = getCanSurface(can);
    if (!surface) return;
    surface.uLabelDim.value = isFeatured ? this.data.labelDim : 0;
    const strength = isFeatured ? this.benefitGlowStrength * this.data.labelDim : 0;
    surface.uGlowStrength.value = strength;
    if (strength > 0.001) {
      surface.uGlowColor.value.copy(this.glowColor);
      if (this.benefitGlowIndex >= 0) surface.uGlowRect.value.copy(BENEFIT_GLOW_RECTS[this.benefitGlowIndex]);
    }
  }

  /**
   * Master timeline built from SCENE_SEQUENCE: segment k spans [k, k + 1]; the transition to
   * state k + 1 runs through the middle of the segment so each section holds its pose while it
   * is centred in the viewport.
   */
  private buildMasterTimeline() {
    this.masterTimeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

    const stateToData = (state: SceneStateConfig) => ({
      camPosX: state.camera.posX,
      camPosY: state.camera.posY,
      camPosZ: state.camera.posZ,
      fov: state.camera.fov,
      camRotX: state.camera.rotX,
      camRotY: state.camera.rotY,
      camRotZ: state.camera.rotZ,
      canScale: state.product.scale,
      canPosX: state.product.posX,
      canPosY: state.product.posY,
      canPosZ: state.product.posZ,
      canRotX: state.product.rotX,
      canRotY: state.product.rotY,
      canRotZ: state.product.rotZ,
      canSpin: state.product.spin,
      spacing: state.spacing,
      wave: state.wave,
      swirl: state.swirl,
      pointerInfluence: state.lighting.pointerInfluence,
      labelDim: state.lighting.labelDim ?? 0,
      ...state.stage,
    });

    this.timelineData = { ...this.data, ...stateToData(SCENE_STATES[SCENE_SEQUENCE[0].state]) };
    Object.assign(this.data, this.timelineData);
    for (let k = 1; k < SCENE_SEQUENCE.length; k += 1) {
      this.masterTimeline.to(this.timelineData, { ...stateToData(SCENE_STATES[SCENE_SEQUENCE[k].state]), duration: 0.7 }, k - 0.85);
    }
    // Pad the end so the last waypoint lands exactly on progress 1.
    this.masterTimeline.to(this.timelineData, { duration: 0.15 }, SCENE_SEQUENCE.length - 1.15);
  }

  public seekProgress(progress: number) {
    if (!this.masterTimeline) return;
    this.targetTimelineProgress = Math.max(0, Math.min(1, progress));
    this.sectionPosition = this.targetTimelineProgress * (SCENE_SEQUENCE.length - 1);
    // The ring is only interactive while the hero section is centred.
    const segment = 1 / (SCENE_SEQUENCE.length - 1);
    this.currentMode = progress < segment * 0.5 ? 'hero-carousel' : 'feature-editorial';
  }

  // ───────────────────────── pointer ─────────────────────────

  private onPointerDown = (e: PointerEvent) => {
    if (this.routeMode !== 'HOME') return;
    // single-can scenes: dragging turns the can; hero and lineup keep their own drag
    this.dragTurn = this.data.wave < 0.4 && this.data.swirl < 0.4;
    this.isPointerDown = true;
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.lastDragX = e.clientX;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // not capturable (synthetic event): dragging still works without capture
    }
  };

  private onPointerMoveDrag = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (!this.isDragging && Math.hypot(dx, dy) > 6) this.isDragging = true;
    if (this.isDragging && this.dragTurn) {
      this.turnCan((e.clientX - this.lastDragX) * 0.012, 0);
      this.lastDragX = e.clientX;
      return;
    }
    if (this.isDragging && this.data.wave > 0.4) {
      const stepX = e.clientX - this.lastDragX;
      this.lastDragX = e.clientX;
      const deltaWorld = stepX * (14 / Math.max(window.innerWidth, 320));
      this.carousel.position -= deltaWorld;
      this.carousel.target -= deltaWorld;
    }
  };

  private onPointerUpDrag = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      // nothing captured
    }
    if (this.isDragging && this.dragTurn) {
      this.isDragging = false;
      return;
    }
    if (this.isDragging) {
      this.isDragging = false;
      this.carousel.target = Math.round(this.carousel.position / this.carousel.spacing) * this.carousel.spacing;
    } else if (this.routeMode === 'HOME') {
      if (this.data.swirl > 0.4) this.handleLineupClick(e.clientX, e.clientY);
      else if (this.data.wave > 0.4) this.handleCanClick(e.clientX, e.clientY);
    }
  };

  private pickCan(clientX: number, clientY: number, pool: THREE.Group[]): THREE.Group | null {
    this.pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hit = this.raycaster.intersectObjects(pool, true)[0];
    let node: THREE.Object3D | null = hit?.object ?? null;
    while (node) {
      if (pool.includes(node as THREE.Group)) return node as THREE.Group;
      node = node.parent;
    }
    return null;
  }

  private handleLineupClick = (clientX: number, clientY: number) => {
    const clicked = this.pickCan(clientX, clientY, this.cans);
    if (!clicked) return;
    const canIndex = this.cans.indexOf(clicked) % FLAVORS.length;
    this.carousel.goTo(canIndex);
    audioManager.playCanHover([330, 370, 415, 494, 554, 659][canIndex % 6], 0.28);
  };

  private handleCanClick = (clientX: number, clientY: number) => {
    const clicked = this.pickCan(clientX, clientY, this.cans);
    if (!clicked) return;
    const canIndex = this.cans.indexOf(clicked);
    const target = canIndex * this.carousel.spacing - this.carousel.position;
    const minX = this.cans.length * -0.5 * this.carousel.spacing;
    const maxX = this.cans.length * 0.5 * this.carousel.spacing;
    const x = wrap(target, minX, maxX);
    if (Math.abs(x) < 0.65 * this.carousel.spacing) this.onHeroCanClicked?.();
    else this.carousel.target += Math.round(x / this.carousel.spacing) * this.carousel.spacing;
  };

  private onWheel = (e: WheelEvent) => {
    if (this.routeMode !== 'HOME' || this.data.wave < 0.6) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 12) {
      e.preventDefault();
      this.carousel.target += Math.sign(e.deltaX) * this.carousel.spacing;
    }
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private onContextRestored = () => {
    this.contextLost = false;
  };

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMoveDrag);
    this.canvas.addEventListener('pointerup', this.onPointerUpDrag);
    this.canvas.addEventListener('pointercancel', this.onPointerUpDrag);
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  // ───────────────────────── routes ─────────────────────────

  /**
   * Route switch. Entering a product carries the featured can over: every can's current transform
   * is captured and the loop blends from it to the product pose (the others shrink away).
   */
  public setRoute(mode: 'HOME' | 'PRODUCT' | 'PAGE', productSlug?: string) {
    const previous = this.routeMode;
    this.routeMode = mode;
    if (mode !== 'HOME') this.fruit.clear();
    if (mode !== 'PRODUCT') return;

    const index = FLAVORS.findIndex((flavor) => flavor.id === productSlug);
    if (index !== -1) this.activeProductIndex = index;
    this.productViewerRotation = { x: 0, y: 0, targetX: 0, targetY: 0 };
    void this.labels.ensureSurface(this.activeProductIndex);
    void this.labels.ensureAlbedo(this.activeProductIndex, 1);
    if (this.labels.maxLod >= 2) void this.labels.ensureAlbedo(this.activeProductIndex, 2);

    // Prefer the can already in focus on the home scene; otherwise the nearest of that flavor.
    const count = this.cans.length;
    const featured = ((Math.round(this.carousel.position / this.carousel.spacing) % count) + count) % count;
    let best = this.activeProductIndex;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = this.activeProductIndex; i < count; i += FLAVORS.length) {
      const distance = Math.min(Math.abs(i - featured), count - Math.abs(i - featured));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    this.productCanIndex = best;

    const cameFromScene = previous === 'HOME' && this.hasRenderedHome;
    this.cans.forEach((can, i) => {
      const from = this.routeFrom[i];
      from.position.copy(can.position);
      from.quaternion.copy(can.quaternion);
      from.scale = cameFromScene && can.visible ? can.scale.x : 0;
    });
    this.routeCameraFrom.copy(this.camera.position);
    this.routeBlend = cameFromScene ? 0 : 0.35;
  }

  public setInitialFlavor(index: number) {
    const normalized = ((index % FLAVORS.length) + FLAVORS.length) % FLAVORS.length;
    const position = normalized * this.carousel.spacing;
    this.carousel.position = position;
    this.carousel.target = position;
    this.carouselVelocity = 0;
    this.carousel.lastIndex = normalized;
    this.lastAccentIndex = -1;
  }

  /** Product page scroll (in viewport heights); on narrow screens the can scrolls away with the hero. */
  public setProductScroll(progress: number) {
    this.productScroll = Math.max(0, progress);
  }

  public setProductExit(amount: number) {
    this.productExit = THREE.MathUtils.clamp(amount, 0, 1);
  }

  /** Turns the featured home can like a model viewer (radians). Ignored outside the home story. */
  public turnCan(deltaYaw: number, deltaPitch: number) {
    if (this.routeMode !== 'HOME') return;
    const t = this.userTurn;
    t.targetYaw += deltaYaw;
    t.targetPitch = THREE.MathUtils.clamp(t.targetPitch + deltaPitch, -0.6, 0.6);
    t.lastInput = performance.now();
  }

  private updateUserTurn(delta: number, time: number) {
    const t = this.userTurn;
    if (time - t.lastInput > 3500) {
      // idle: settle back to the designed pose by the shortest way round
      t.targetYaw = Math.round(t.yaw / (Math.PI * 2)) * Math.PI * 2;
      t.targetPitch = 0;
    }
    const k = 1 - Math.exp(-(this.reducedMotion ? 30 : 7) * delta);
    t.yaw += (t.targetYaw - t.yaw) * k;
    t.pitch += (t.targetPitch - t.pitch) * k;
    if (time - t.lastInput > 3500 && Math.abs(t.yaw - t.targetYaw) < 1e-3 && Math.abs(t.pitch) < 1e-3) {
      t.yaw = 0;
      t.targetYaw = 0;
      t.pitch = 0;
    }
  }

  /** Drag-to-rotate on the product page. */
  public rotateProduct(deltaX: number, deltaY: number) {
    if (this.routeMode !== 'PRODUCT') return;
    this.productViewerRotation.targetY += deltaX * 0.01;
    this.productViewerRotation.targetX = Math.max(-0.5, Math.min(0.5, this.productViewerRotation.targetX + deltaY * 0.006));
  }

  /** Turn the product can to show the front or the back panel. */
  public setProductView(view: 'FRONT' | 'BACK') {
    if (this.routeMode !== 'PRODUCT') return;
    this.productViewerRotation.targetX = 0;
    const panelCentreU = (LABEL.panels.right[0] + LABEL.panels.right[1]) / 2;
    const isNarrow = window.innerWidth < 1024;
    const poseYaw = (isNarrow ? PRODUCT_POSE_NARROW : PRODUCT_POSE).rotY;
    this.productViewerRotation.targetY = view === 'BACK' ? (0.5 - panelCentreU) * Math.PI * 2 - poseYaw : 0;
  }

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.post?.setSize(width, height);
    this.stage.resize(width, height);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.pointer.x = e.clientX - window.innerWidth / 2;
    this.pointer.y = e.clientY - window.innerHeight / 2;
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    this.pointerLightTarget.x = ndcX * halfH * this.camera.aspect;
    this.pointerLightTarget.y = ndcY * halfH;
  };

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.isRunning = false;
    } else {
      this.isRunning = true;
      this.lastTime = performance.now();
    }
  };

  // ───────────────────────── frame loop ─────────────────────────

  public animate = (now: number) => {
    this.reqId = requestAnimationFrame(this.animate);
    if (!this.isRunning || this.contextLost) return;
    const time = this.timeOverride ?? now;
    const rawDelta = (now - this.lastTime) / 1000;
    const delta = Math.min(rawDelta, 0.05);
    this.lastTime = now;
    this.governQuality(rawDelta, now);

    // Frame-rate independent damping keeps scroll, pointer and product motion consistent on 60 Hz,
    // high refresh and throttled mobile displays.
    const pointerBlend = 1 - Math.exp(-12 * delta);
    this.pointer.smoothX += (this.pointer.x - this.pointer.smoothX) * pointerBlend;
    this.pointer.smoothY += (this.pointer.y - this.pointer.smoothY) * pointerBlend;
    this.updateUserTurn(delta, now);
    {
      const raw = delta > 0 ? (this.sectionPosition - this.lastSectionPosition) / delta : 0;
      this.lastSectionPosition = this.sectionPosition;
      const target = this.reducedMotion ? 0 : THREE.MathUtils.clamp(raw, -6, 6);
      this.scrollVelocity += (target - this.scrollVelocity) * (1 - Math.exp(-5 * delta));
    }

    // the camera trails the scroll a little (cinematic follow), never snapping to it
    const timelineBlend = 1 - Math.exp(-9 * delta);
    this.currentTimelineProgress += (this.targetTimelineProgress - this.currentTimelineProgress) * timelineBlend;
    if (Math.abs(this.targetTimelineProgress - this.currentTimelineProgress) > 0.0001) {
      this.masterTimeline.seek(this.currentTimelineProgress * this.masterTimeline.duration());
    } else if (this.masterTimeline.progress() !== this.targetTimelineProgress) {
      this.currentTimelineProgress = this.targetTimelineProgress;
      this.masterTimeline.seek(this.currentTimelineProgress * this.masterTimeline.duration());
    }

    Object.assign(this.data, this.timelineData);
    this.fx.flash = 0;
    this.fx.burst = 0;
    this.fx.water = 0;
    this.canOverride.blend = 0;
    this.cameraOffset.set(0, 0, 0);
    this.cameraRollOffset = 0;
    this.stepCarousel(delta, now);
    if (this.routeMode === 'HOME') this.moments.forEach((moment) => moment.update(time * 0.001, this));
    // the air is the same on every 3D route: the dust keeps drifting on the product page too
    this.iceDust?.update(time * 0.001, this);
    // live sky: refreshed once a minute (the moon and the hour change slowly)
    if (now - this.skyCheckedAt > 60_000) {
      this.skyCheckedAt = now;
      const date = new Date();
      const tw = twilight(date);
      this.stageParams.moonPhase = moonPhase(date);
      this.stageParams.dawn = tw.dawn;
      this.stageParams.dusk = tw.dusk;
    }
    const dropTarget = this.routeMode === 'PRODUCT' ? 1 : 0.4 + 0.6 * this.data.wave;
    condensation.uDropStrength.value += (dropTarget - condensation.uDropStrength.value) * (1 - Math.exp(-4 * delta));
    if (!this.reducedMotion) condensation.uDropTime.value += delta;

    if (this.routeMode === 'PRODUCT') this.renderProduct(delta, time);
    else if (this.routeMode === 'HOME') this.renderHome(delta, time, now);
    else this.renderPage(time);
  };

  /** Critically damped spring: a soft, physical start and stop without a frame-rate dependent snap. */
  private stepCarousel(delta: number, now: number) {
    const springFrequency = 16;
    const springError = this.carousel.position - this.carousel.target;
    const springImpulse = this.carouselVelocity + springFrequency * springError;
    const springDecay = Math.exp(-springFrequency * delta);
    this.carousel.position = this.carousel.target + (springError + springImpulse * delta) * springDecay;
    this.carouselVelocity = (this.carouselVelocity - springFrequency * springImpulse * delta) * springDecay;
    if (Math.abs(springError) < 0.0005 && Math.abs(this.carouselVelocity) < 0.005) {
      this.carousel.position = this.carousel.target;
      this.carouselVelocity = 0;
    }
    const currentIdx = this.carousel.getIndex();
    if (currentIdx !== this.carousel.lastIndex) {
      this.carousel.listeners.forEach((cb) => cb({ index: currentIdx, previous: this.carousel.lastIndex }));
      this.carousel.lastIndex = currentIdx;
      if (!this.reducedMotion) this.spinStart = now;
      this.fruit.burst(currentIdx);
      audioManager.play('change');
    }
    // One full turn of the focused can when the flavor changes.
    const spinT = (now - this.spinStart) / 900;
    // the ring itself slides to the new flavor (as in the reference): no extra full turn of the can
    this.spinOffset = 0;
    void spinT;
  }

  /** Accent colour wave: starts when the focused flavor changes, floods out from the focus can. */
  private updateAccent(flavorIndex: number, time: number) {
    const flavor = FLAVORS[flavorIndex % FLAVORS.length];
    if (this.lastAccentIndex < 0) {
      this.accentFrom.set(flavor.theme.secondary);
      this.accentTo.set(flavor.theme.secondary);
      this.wipeStart = -1e9;
    } else if (flavorIndex !== this.lastAccentIndex) {
      this.accentFrom.copy(this.accentTo);
      this.accentTo.set(flavor.theme.secondary);
      this.wipeStart = time;
    }
    this.lastAccentIndex = flavorIndex;
    const wipeT = Math.min(1, Math.max(0, (time - this.wipeStart) / (this.reducedMotion ? 1 : 1400)));
    this.stageParams.wipe = wipeT >= 1 ? 1 : 1 - (1 - wipeT) ** 3;
    this.stageParams.accentPrev.copy(this.accentFrom);
    this.stageParams.accent.copy(this.accentTo);
    this.stageParams.wipeOrigin.copy(this.focusScreen);
    this.glowColor.copy(this.accentTo);
  }

  private applyCamera(isMobile: boolean, time: number) {
    this.camera.fov = this.data.fov;
    this.camera.updateProjectionMatrix();
    // Phones are too narrow for the sideways orbit: keep the camera centred there.
    const lateral = isMobile ? 0 : 1;
    this.camera.position.set(
      this.data.camPosX * lateral + this.cameraOffset.x,
      this.data.camPosY + this.cameraOffset.y,
      (isMobile ? this.data.camPosZ + (this.data.wave > 0.5 ? 6.5 : 2) : this.data.camPosZ) + this.cameraOffset.z
    );
    // A whisper of idle sway keeps the camera alive without ever reading as motion.
    const sway = this.reducedMotion ? 0 : 1;
    this.camera.rotation.set(
      this.data.camRotX + Math.sin(time * 0.00031) * 0.0035 * sway,
      this.data.camRotY * lateral + Math.cos(time * 0.00027) * 0.004 * sway,
      this.data.camRotZ + this.cameraRollOffset
    );
  }

  /** Writes the timeline's stage values and the focus can's screen position into the stage. */
  private updateStage(time: number, focus: THREE.Object3D | null) {
    const p = this.stageParams;
    const d = this.data;
    p.time = time * 0.001;
    p.aspect = this.camera.aspect;
    p.horizon = THREE.MathUtils.clamp(0.5 - (0.5 * Math.tan(this.camera.rotation.x)) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)), 0.05, 0.95);
    p.camX = this.camera.position.x;
    p.camY = this.camera.position.y;
    p.scroll = this.sectionPosition;
    p.moon = d.moon;
    p.field = d.field;
    p.studio = d.studio;
    p.mountains = d.mountains;
    // the colour field is a clean studio gradient: no night mist drawn over it
    const clear = 1 - THREE.MathUtils.clamp(d.field + d.studio, 0, 1);
    p.mist = (0.6 + 0.4 * d.mistFg) * clear;
    p.mistFg = d.mistFg * (this.quality === 'HIGH' ? 1 : 0.7) * clear;
    p.glow = d.glow;
    p.stars = d.stars;
    p.flash = this.fx.flash;
    p.burst = this.fx.burst;
    p.water = this.fx.water;
    p.burstPos.copy(this.fx.burstPos);
    if (focus) {
      this.camera.updateMatrixWorld();
      this.tmpVector.setFromMatrixPosition(focus.matrixWorld).project(this.camera);
      this.focusScreen.set(this.tmpVector.x * 0.5 + 0.5, this.tmpVector.y * 0.5 + 0.5);
      p.glowPos.copy(this.focusScreen);
    }
    this.stage.update(p);
    this.stage.renderBackdrop();
  }

  private renderScene(time: number) {
    if (this.post) this.post.render(time * 0.001);
    else this.renderer.render(this.scene, this.camera);
  }

  /** Plain pages (bag, checkout, story, 404): the night stage only, redrawn at a relaxed pace. */
  private pageFrame = 0;
  private renderPage(time: number) {
    this.pageFrame += 1;
    if (this.pageFrame % 2 === 1) return;
    this.cans.forEach((can) => (can.visible = false));
    this.reflections?.hideAll();
    Object.assign(this.data, { camPosX: 0, camPosY: 0, camPosZ: 29, camRotX: 0.04, camRotY: 0, camRotZ: 0, mountains: 0.55, moon: 0.7, mistFg: 0.5, glow: 0, stars: 0.8, field: 0, studio: 0 });
    this.applyCamera(false, time);
    this.updateAccent(this.carousel.getIndex(), time);
    this.updateStage(time, null);
    this.renderScene(time);
  }

  private renderHome(delta: number, time: number, now: number) {
    const isMobile = window.innerWidth < 768;
    this.hasRenderedHome = true;
    this.applyCamera(isMobile, time);

    const closeUp = this.data.wave < 0.3 && this.data.swirl < 0.5;
    this.streamLabels(this.carousel.getIndex(), closeUp);
    this.updateAccent(this.carousel.getIndex(), time);

    // Benefit label glow: flavor-coloured, one block at a time, damped.
    const glowTarget = this.benefitGlowIndex >= 0 ? 1 : 0;
    this.benefitGlowStrength += (glowTarget - this.benefitGlowStrength) * (1 - Math.exp(-6 * delta));

    this.baseFill.intensity = 0.2 + 0.7 * this.data.wave;
    // Benefit chapters: a stronger front light so the active label block reads sharp and bright.
    this.keyLight.intensity = 1.05 + 0.6 * this.data.labelDim; // a real key on the featured can in every scene
    this.fillLight.intensity = 0.18 + 0.5 * this.data.labelDim;
    // Back light picks up the flavor colour, like a coloured gel behind a product shot.
    this.rimTint.copy(this.rimBase).lerp(this.glowColor, 0.55);
    this.rimLight.color.lerp(this.rimTint, 1 - Math.exp(-4 * delta));

    // Flavor change: a soft-box glint sweeps across the featured can, left to right.
    const glintT = (now - this.spinStart) / 1100;
    if (glintT >= 0 && glintT < 1) {
      this.flashLight.intensity = Math.sin(Math.PI * glintT) ** 2 * 2.2;
      this.flashLight.position.set(this.data.canPosX - 7 + glintT * 14, this.data.canPosY + 3, this.data.canPosZ + 6);
      this.flashLight.target.position.set(this.data.canPosX, this.data.canPosY, this.data.canPosZ);
      this.flashLight.target.updateMatrixWorld();
    } else if (this.flashLight.intensity !== 0) {
      this.flashLight.intensity = 0;
    }

    // Responsive carousel spacing
    const targetSpacing = isMobile ? CAROUSEL_CONFIG.spacingMobile : CAROUSEL_CONFIG.spacing;
    if (Math.abs(this.carousel.spacing - targetSpacing) > 0.005) {
      const ratio = this.carousel.position / (this.carousel.spacing || 1);
      this.carousel.spacing = targetSpacing;
      this.carousel.position = ratio * targetSpacing;
      this.carousel.target = Math.round(ratio) * targetSpacing;
    }

    // Key light follows the featured can so its top rim always catches the hot specular.
    const pointerX = this.reducedMotion ? 0 : this.pointer.smoothX / (window.innerWidth / 2);
    const pointerY = this.reducedMotion ? 0 : this.pointer.smoothY / (window.innerHeight / 2);
    this.keyLight.position.set(this.data.canPosX - 4.2 + pointerX * 3, this.data.canPosY + 4.6 - pointerY * 2, this.data.canPosZ + 3.6);
    this.keyLight.target.position.set(this.data.canPosX, this.data.canPosY, this.data.canPosZ);
    this.keyLight.target.updateMatrixWorld();

    // Intro safety net: never leave the cans parked if the loader never reports.
    if (this.introArmedAt >= 0 && now - this.introArmedAt > 8000) this.playIntro();
    if (this.introStart > -1e8 && this.introStart < now - 4500) this.introStart = -1e9;

    this.layoutCans(delta, time, isMobile);
    this.reflections?.update(this.cans, this.data.floorY, this.data.reflect, this.reducedMotion);
    const focus = this.cans[this.carousel.getIndex()] ?? this.cans[0];
    this.updateStage(time, focus);
    this.renderScene(time);
  }

  /** Positions every can for the current timeline state: hero ring, single feature or finale lineup. */
  private layoutCans(delta: number, time: number, isMobile: boolean) {
    const minX = this.cans.length * -0.5 * this.carousel.spacing;
    const maxX = this.cans.length * 0.5 * this.carousel.spacing;
    let maxHoverInfluence = 0;
    let bestHoverCanIndex = -1;
    // The finale row uses every can (two of each flavor), like a full shelf.
    const lineupCount = this.cans.length;

    this.cans.forEach((can, i) => {
      const target = i * this.carousel.spacing - this.carousel.position;
      const x = wrap(target, minX, maxX);
      const stepDist = Math.abs(x) / this.carousel.spacing;
      const centerWeight = Math.max(0, 1 - stepDist);
      const p = smooth(centerWeight);

      // Finale: every flavor once, on a mountain-shaped lineup. Blends from the featured pose as swirl goes 0 → 1.
      if (this.data.swirl > 0.01) {
        const s = this.data.swirl;
        // the active flavor lands near the middle of the row
        const slot = LINEUP_SLOTS[(((i - this.carousel.getIndex() + 5) % lineupCount) + lineupCount) % lineupCount];
        const isFeatured = p > 0.4;
        const fromScale = isFeatured ? this.data.canScale : 0;
        can.visible = isFeatured || s > 0.25;
        const mobileK = isMobile ? 0.3 : 1; // phones: the whole ridge fits the narrow frame, with a margin
        // Each can drops in on its own beat (back row first), with a small settle.
        const local = THREE.MathUtils.clamp((s - slot.delay * 0.7) / (1 - slot.delay * 0.7), 0, 1);
        const drop = (1 - landing(local)) * 9;
        const phase = this.canIdlePhase[i];
        const breath = this.reducedMotion ? 0 : Math.sin(time * 0.0008 + phase) * 0.014;
        can.position.set(
          this.data.canPosX * (1 - s) + slot.x * mobileK * s,
          this.data.canPosY * (1 - s) + (slot.y * mobileK + breath + drop) * s,
          this.data.canPosZ * (1 - s) + slot.z * s
        );
        can.rotation.set(
          this.data.canRotX * (1 - s) + slot.rotX * s,
          this.data.canRotY * (1 - s) + slot.rotY * s,
          this.data.canRotZ * (1 - s) + slot.rotZ * s
        );
        const canScale = fromScale * (1 - s) + this.data.canScale * (isMobile ? 0.46 : 1) * s;
        can.scale.setScalar(canScale);
        setCanFocus(can, Math.round(Math.max(0.02, (isFeatured ? 1 - s : 0) + s * 0.95) * 100) / 100);
        this.applyLabelState(can, false);
        this.applyCanOverride(can, i);
        return;
      }

      // Feature editorial: one single large can; all others recede and are hidden.
      if (this.currentMode === 'feature-editorial' && this.data.wave < 0.15) {
        const isFeatured = p > 0.4;
        can.visible = isFeatured;
        if (!isFeatured) {
          can.position.set(0, -999, 0);
          return;
        }
        let featX = this.data.canPosX;
        let featY = this.data.canPosY;
        let featScale = this.data.canScale;
        let featRotX = this.data.canRotX;
        let featRotY = this.data.canRotY + this.data.canSpin;
        if (isMobile) {
          // Phones shrink the can (benefit close-ups most, blended through labelDim). The
          // vertical pose scales with it, so the lit benefit block keeps its place on screen
          // instead of the can for the lowest block leaving the top of the frame.
          // (the desktop intro can is very large; phones keep it to the old on-screen size)
          const k = 0.45 + 0.13 * this.data.labelDim;
          featScale *= k;
          featY = featY * k + 1.45 + 1.4 * (1 - this.data.labelDim); // copy sits at the bottom, so the can rides higher
          featX = 0.58;
        }
        featRotY += (this.pointer.smoothX / 1280) * this.tilt() + this.spinOffset;
        featRotY += this.userTurn.yaw;
        featRotX = featRotX + this.userTurn.pitch;
        // inertia: the can leans back against a fast scroll and trails it slightly, then settles
        featRotX -= this.scrollVelocity * 0.07;
        featY += this.scrollVelocity * 0.12;
        featRotX += (this.pointer.smoothY / 1280) * this.tilt();
        setCanFocus(can, 1);
        this.applyLabelState(can, true);
        can.position.set(featX, featY, this.data.canPosZ);
        can.rotation.set(featRotX, featRotY, this.data.canRotZ);
        can.scale.setScalar(featScale);
        this.applyCanOverride(can, i);
        return;
      }

      const heroScale = (isMobile ? CAROUSEL_CONFIG.heroScaleMobile : CAROUSEL_CONFIG.heroScale) * this.heroFit;
      const ringRadius = isMobile ? CAROUSEL_CONFIG.ringRadiusMobile : CAROUSEL_CONFIG.ringRadius;
      const heroWeight = Math.max(0, 1 - stepDist * 1.15);
      const heroWeightSmooth = smooth(heroWeight);

      // Position on a shallow, symmetric arc; cans past the visible slots shrink away.
      const theta = x / ringRadius;
      const ringX = Math.sin(theta) * ringRadius;
      const ringZ = (Math.cos(theta) - 1) * ringRadius;
      const visibleSlots = isMobile ? CAROUSEL_CONFIG.visibleSlotsMobile : CAROUSEL_CONFIG.visibleSlots;
      const edge = Math.min(1, Math.max(0, (visibleSlots + 0.45 - stepDist) / 0.9));
      const edgeFade = smooth(edge);
      const ringArc = (isMobile ? CAROUSEL_CONFIG.ringArcMobile : CAROUSEL_CONFIG.ringArc) * Math.min(stepDist, 3) ** 2;
      // tilted ring: lower left of centre, higher right of it, level again at the edges (signed slots)
      const ringWave = (isMobile ? CAROUSEL_CONFIG.ringWaveMobile : CAROUSEL_CONFIG.ringWave) *
        Math.sin((Math.PI * x) / (this.carousel.spacing * CAROUSEL_CONFIG.ringWaveSlots)) * (1 - heroWeightSmooth);
      // neighbours a little smaller than the centre can (a product wall, as in the reference)
      const neighbourScale = CAROUSEL_CONFIG.neighbourScale + (1 - CAROUSEL_CONFIG.neighbourScale) * heroWeightSmooth;
      let canScale = heroScale * neighbourScale * (0.75 + 0.25 * edgeFade);
      // a product wall, not a parade: each neighbour hangs at its own height and lean (stable per can)
      const scatter = (1 - heroWeightSmooth) * (isMobile ? 0.4 : 1);
      const scatterY = Math.sin(i * 2.37 + 0.8) * 0.3 * scatter;
      const scatterRoll = Math.sin(i * 1.71 + 2.1) * 0.22 * scatter;
      let canPosX = ringX * this.data.wave;
      let canPosY = (CAROUSEL_CONFIG.yBase + (isMobile ? 0.7 : 0) + this.heroLift + ringArc + ringWave + scatterY) * this.data.wave;
      let canPosZ = (ringZ + CAROUSEL_CONFIG.heroLift * heroWeightSmooth - (1 - edgeFade) * 3) * this.data.wave;

      const pitch = CAROUSEL_CONFIG.pitchNeighbour + (CAROUSEL_CONFIG.pitchX - CAROUSEL_CONFIG.pitchNeighbour) * heroWeightSmooth;
      let canRotX = pitch * this.data.wave;
      let canRotY = (CAROUSEL_CONFIG.yawHeroY + theta * CAROUSEL_CONFIG.labelTurn * (1 - heroWeightSmooth)) * this.data.wave;
      let canRotZ = (CAROUSEL_CONFIG.rollZ * heroWeightSmooth + Math.sin(theta) * CAROUSEL_CONFIG.neighbourLean + scatterRoll) * this.data.wave;

      let targetSectionScale = this.data.canScale;
      let targetSectionPosY = this.data.canPosY;
      let targetSectionPosX = this.data.canPosX;
      if (isMobile && this.data.wave < 0.5) {
        targetSectionScale *= 0.65;
        targetSectionPosY += 1.0;
        targetSectionPosX *= 0.2;
      }

      can.visible = (this.data.wave >= 0.8 && edgeFade > 0.02) || p > 0.4;

      const collapseBlend = Math.max(0, 1 - this.data.wave);
      canScale += (targetSectionScale - canScale) * collapseBlend;
      canPosY += (targetSectionPosY - canPosY) * collapseBlend;
      canPosZ += (this.data.canPosZ - canPosZ) * collapseBlend;
      canPosX += (targetSectionPosX - canPosX) * collapseBlend;

      // Depth falloff: the focused can is fully lit, neighbours step into the dark.
      // neighbours fall to dark silhouettes (chrome edges and a hint of label); only the centre can is lit
      const ringFocus = (0.07 + 0.13 * Math.max(0, 1 - stepDist / 3)) * edgeFade + 0.8 * heroWeightSmooth;
      const focus = Math.max(ringFocus, p * collapseBlend);
      setCanFocus(can, Math.round(focus * 100) / 100);
      this.applyLabelState(can, p > 0.4);

      canRotX += this.data.canRotX * collapseBlend;
      canRotY += this.data.canRotY * collapseBlend;
      canRotZ += this.data.canRotZ * collapseBlend;
      canRotY += this.data.canSpin * p;
      canRotY += this.userTurn.yaw * p;
      canRotX += this.userTurn.pitch * p;
      canRotX -= this.scrollVelocity * 0.05 * p;
      // The focused can tilts toward the pointer.
      canRotY += (this.pointer.smoothX / 1280) * this.tilt() * p + this.spinOffset * p;
      canRotX += (this.pointer.smoothY / 1280) * this.tilt() * p;

      // Per-can hover proximity: physical tilt, lift and z-push, exponentially damped.
      if (!isMobile && can.visible && this.data.wave > 0.3) {
        const dx = canPosX - this.camera.position.x - this.pointerLightTarget.x;
        const dy = canPosY - this.camera.position.y - this.pointerLightTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximityRadius = this.carousel.spacing * 0.85;
        const rawInfluence = Math.max(0, 1 - dist / proximityRadius);
        const targetHover = this.reducedMotion ? 0 : rawInfluence * rawInfluence;
        this.canHoverInfluence[i] += (targetHover - this.canHoverInfluence[i]) * (1 - Math.exp(-8 * delta));
        const h = this.canHoverInfluence[i];
        if (h > maxHoverInfluence) {
          maxHoverInfluence = h;
          bestHoverCanIndex = i;
        }
        if (h > 0.01) {
          canRotX += -dy * 0.08 * h;
          canRotY += dx * 0.06 * h;
          canPosY += h * 0.12;
          canPosZ += h * 0.35;
          canScale *= 1 + h * 0.06;
        }
      } else if (this.canHoverInfluence[i] > 0.001) {
        this.canHoverInfluence[i] *= 1 - Math.min(1, 6 * delta);
      }

      // Idle micro-breathing so cans never feel frozen.
      if (can.visible && this.data.wave > 0.3 && !this.reducedMotion) {
        const phase = this.canIdlePhase[i];
        canPosY += Math.sin(time * 0.0008 + phase) * 0.025;
        canRotZ += Math.cos(time * 0.00056 + phase) * 0.008;
      }

      if (this.introStart > -1e8) {
        const rise = this.introProgress(time, stepDist);
        // Held for the opening: the rest of the ring waits out of frame (and out of the reflections).
        if (this.introStart === Number.POSITIVE_INFINITY && this.canOverride.index !== i) can.visible = false;
        canPosY -= (1 - rise) * 7.5;
        canRotY += (1 - rise) * 2.2;
      }

      can.position.set(canPosX, canPosY, canPosZ);
      can.rotation.set(canRotX, canRotY, canRotZ);
      can.scale.setScalar(canScale);
      this.applyCanOverride(can, i);
    });

    // Resonant chime when the pointer crosses onto another can.
    if (!isMobile && (this.data.wave > 0.3 || this.data.swirl > 0.5)) {
      if (maxHoverInfluence > 0.12 && bestHoverCanIndex !== -1) {
        if (this.lastHoveredCanIndex !== bestHoverCanIndex && time - this.lastHoverAudioTime > 80) {
          this.lastHoveredCanIndex = bestHoverCanIndex;
          this.lastHoverAudioTime = time;
          audioManager.playCanHover([330, 370, 415, 494, 554, 659][((bestHoverCanIndex % 6) + 6) % 6], 0.22);
        }
      } else if (maxHoverInfluence < 0.03) {
        this.lastHoveredCanIndex = -1;
      }
    }
    this.cans.forEach((can) => can.updateMatrixWorld(true));
  }

  private applyCanOverride(can: THREE.Group, index: number) {
    const o = this.canOverride;
    if (o.index !== index || o.blend <= 0.001) return;
    can.visible = true;
    can.position.lerp(o.position, o.blend);
    this.overrideEuler.set(
      THREE.MathUtils.lerp(can.rotation.x, o.rotation.x, o.blend),
      THREE.MathUtils.lerp(can.rotation.y, o.rotation.y, o.blend),
      THREE.MathUtils.lerp(can.rotation.z, o.rotation.z, o.blend)
    );
    can.rotation.copy(this.overrideEuler);
    can.scale.setScalar(THREE.MathUtils.lerp(can.scale.x, o.scale, o.blend));
    setCanFocus(can, 1);
  }

  /**
   * Product page pose: one large can, left of the purchase panel on desktop and above it on narrow
   * screens. Blends in from the captured home transforms.
   */
  private renderProduct(delta: number, time: number) {
    const isNarrow = window.innerWidth < 1024;
    const viewerBlend = 1 - Math.exp(-8 * delta);
    const rotation = this.productViewerRotation;
    rotation.x += (rotation.targetX - rotation.x) * viewerBlend;
    rotation.y += (rotation.targetY - rotation.y) * viewerBlend;

    this.routeBlend += (1 - this.routeBlend) * (1 - Math.exp(-3.6 * delta));
    const eased = smooth(this.routeBlend);

    // Same lens as the home scene so the can keeps its scale while travelling.
    // product page: the flavor's own colour field, like a studio packshot (the can on its colour)
    Object.assign(this.data, { camRotX: 0.04, camRotY: 0, camRotZ: 0, floorY: -3.4, reflect: 0.6, mountains: 0.8, moon: 0.9, mistFg: 0.25, glow: 1, stars: 0, wave: 0, swirl: 0, labelDim: 0, field: 0.75, studio: 0 });
    this.camera.fov = PRODUCT_CAMERA.fov;
    this.camera.updateProjectionMatrix();
    this.tmpVector.set(PRODUCT_CAMERA.x, PRODUCT_CAMERA.y, PRODUCT_CAMERA.z);
    this.camera.position.lerpVectors(this.routeCameraFrom, this.tmpVector, eased);
    this.camera.rotation.set(this.data.camRotX, 0, 0);

    const pose = isNarrow ? PRODUCT_POSE_NARROW : PRODUCT_POSE;
    const sway = this.reducedMotion ? 0 : Math.sin(time * 0.0006) * 0.03;
    const scrollLift = isNarrow ? this.productScroll * 7 : smooth(this.productExit) * 11;
    this.tmpEuler.set(pose.rotX + rotation.x, pose.rotY + rotation.y + sway, pose.rotZ);
    this.tmpQuaternion.setFromEuler(this.tmpEuler);
    const flavor = FLAVORS[this.activeProductIndex];
    this.updateAccent(this.activeProductIndex, time);
    this.rimTint.copy(this.rimBase).lerp(this.glowColor, 0.55);
    this.rimLight.color.lerp(this.rimTint, 1 - Math.exp(-4 * delta));
    this.keyLight.position.set(pose.x - 4.2, pose.y + 4.6, 3.6);
    this.keyLight.target.position.set(pose.x, pose.y, 0);
    this.keyLight.target.updateMatrixWorld();
    this.baseFill.intensity = 0.5;

    this.cans.forEach((can, i) => {
      const from = this.routeFrom[i];
      if (i === this.productCanIndex) {
        can.visible = true;
        this.tmpVector.set(pose.x, pose.y + scrollLift + sway * 2, pose.z);
        can.position.lerpVectors(from.position, this.tmpVector, eased);
        can.quaternion.slerpQuaternions(from.quaternion, this.tmpQuaternion, eased);
        const fromScale = from.scale || pose.scale * 0.85;
        can.scale.setScalar(fromScale + (pose.scale - fromScale) * eased);
        setCanFocus(can, 1);
        // Label hotspots light one benefit block, with the rest of the label dimmed a little.
        const glowTarget = this.benefitGlowIndex >= 0 ? 1 : 0;
        this.benefitGlowStrength += (glowTarget - this.benefitGlowStrength) * (1 - Math.exp(-6 * delta));
        const surface = getCanSurface(can);
        if (surface) {
          surface.uLabelDim.value = this.benefitGlowStrength * 0.55;
          surface.uGlowStrength.value = this.benefitGlowStrength;
          surface.uGlowColor.value.set(flavor.theme.secondary);
          if (this.benefitGlowIndex >= 0) surface.uGlowRect.value.copy(BENEFIT_GLOW_RECTS[this.benefitGlowIndex]);
        }
      } else {
        // The rest of the ring clears out quickly so the featured can travels alone.
        const scale = from.scale * Math.max(0, 1 - eased * 3);
        can.visible = scale > 0.01;
        if (can.visible) {
          setCanFocus(can, Math.round(Math.max(0, 0.1 - eased) * 100) / 100);
          can.scale.setScalar(scale);
        }
      }
      can.updateMatrixWorld(true);
    });
    this.reflections?.update(this.cans, this.data.floorY, this.data.reflect, this.reducedMotion);
    this.updateStage(time, this.cans[this.productCanIndex]);
    this.renderScene(time);
  }

  // ───────────────────────── teardown ─────────────────────────

  public dispose() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMoveDrag);
    this.canvas.removeEventListener('pointerup', this.onPointerUpDrag);
    this.canvas.removeEventListener('pointercancel', this.onPointerUpDrag);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.masterTimeline.kill();
    this.moments.forEach((moment) => moment.dispose());
    this.iceDust?.dispose();
    this.reflections?.dispose();
    this.stage.dispose();
    this.post?.dispose();
    this.labels.dispose();
    this.scene.environment?.dispose();
    this.cans.forEach(disposeCanMaterials);
    disposeCanGeometry();
    this.renderer.dispose();
    delete (window as unknown as { __GRIZZLY_SCENE__?: SceneManager }).__GRIZZLY_SCENE__;
  }
}

/** Ease-out with one small bounce: a can landing on the floor. */
function landing(t: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

/**
 * Finale slots (mountain-shaped): the peak stands back and high, two mid cans step down on either
 * side, three front cans on the floor. `delay` staggers the drop: the back row lands first.
 * Slot 0 is the flavor in focus (it takes the peak); the rest follow catalogue order.
 */
/**
 * Finale row: every can (two of each flavor) on one long rising diagonal, leaning like
 * dominoes, nearest and lowest at the left, stepping up and away to the right; the ends run
 * out of frame like a full shelf. The active flavor sits near the middle.
 */
const LINEUP_SLOTS = Array.from({ length: 12 }, (_, k) => {
  const t = k - 5.5;
  return {
    // one tight row receding in depth: near and low at the left (showing bottoms), far and high
    // at the right (showing tops), the cans twisting along it; the floor below stays empty
    x: t * 1.62,
    y: 0.45 + t * 0.4 - 0.012 * t * t, // rising, flattening toward the far end
    z: 2.4 - t * 0.85,
    rotX: -0.5 + (k / 11) * 1.1,
    rotY: -0.3,
    rotZ: 0.14,
    delay: (k / 11) * 0.6,
  };
});
