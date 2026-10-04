import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FLAVORS } from '../data/flavors';
import { LABEL } from '../data/brand';
import { audioManager } from '../audio/audioManager';
import {
  createCanMesh,
  createBaseDiscs,
  generateProceduralLabelTexture,
  createNeutralSurfaceTexture,
  createFlatNormalTexture,
  condensation,
  getCanSurface,
  setCanFocus,
  setCanAccent,
} from './canModel';

/**
 * Bloom writes opaque alpha. The canvas sits over CSS backgrounds, so restore the
 * scene's own alpha and let only the added glow extend coverage.
 */
const AlphaRestoreShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tBase: { value: null as THREE.Texture | null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBase;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 base = texture2D(tBase, vUv);
      vec3 glow = max(color.rgb - base.rgb, 0.0);
      float glowAlpha = clamp(max(glow.r, max(glow.g, glow.b)), 0.0, 1.0);
      gl_FragColor = vec4(color.rgb, max(base.a, glowAlpha));
    }`,
};

/** Product page framing (same lens as the home scene) and the offline packshot framing. */
const PRODUCT_CAMERA = { x: 0, y: 0, z: 29, fov: 20 };
const PACKSHOT_CAMERA = { x: 0, y: 0, z: 14, fov: 22 };
const PRODUCT_POSE = { x: -3.2, y: -0.35, z: 0, scale: 2.05, rotX: 0.1, rotY: 0.3, rotZ: 0.2 };
const PRODUCT_POSE_NARROW = { x: 0, y: 1.6, z: 0, scale: 1.1, rotX: 0.08, rotY: 0.3, rotZ: 0.14 };
const PACKSHOT_POSE = { x: 0, y: 0, z: 0, scale: 0.96, rotX: 0, rotY: 0, rotZ: 0 };

/** UV rects (u0, v0, u1, v1) of the four benefit blocks on the label's side panel. */
// Same rects the label script lays the four benefit blocks into (grizzly.json).
const BENEFIT_GLOW_RECTS = LABEL.benefitBlocks.map(([u0, v0, u1, v1]) => new THREE.Vector4(u0, v0, u1, v1));
import { Scene3DData } from '../types';
import { CAROUSEL_CONFIG } from './sceneManagerConfig';
import { SCENE_SEQUENCE, SCENE_STATES, SceneMode, SceneStateConfig } from './sceneStates';

export { CAROUSEL_CONFIG };
export type { SceneMode, SceneStateConfig };

/**
 * Puts a loaded image into a placeholder texture that materials already use.
 * The GPU copy was allocated at the placeholder's size (immutable storage), so it
 * is released first; otherwise the larger upload overflows it and the map never
 * appears. The loaded wrapper texture is not needed afterwards.
 */
function swapImage(target: THREE.Texture, loaded: THREE.Texture) {
  target.dispose();
  target.image = loaded.image;
  target.needsUpdate = true;
  loaded.dispose();
}

export class SceneManager {
  public currentMode: SceneMode = 'hero-carousel';
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Objects
  public cans: THREE.Group[] = [];
  public baseGroup: THREE.Group | null = null;
  public keyLight!: THREE.DirectionalLight;
  public rimLight!: THREE.DirectionalLight;
  public fillLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public ambientLight!: THREE.AmbientLight;
  public spot1!: THREE.SpotLight;
  public spot2!: THREE.SpotLight;
  public spot3!: THREE.SpotLight;
  public ceilingSpot!: THREE.SpotLight;
  public heroSpotLight!: THREE.SpotLight;
  public floorBounceLight!: THREE.PointLight;
  public topChimeLight!: THREE.DirectionalLight;
  /** Lights the domed can bottoms seen in the hero ring; dimmed elsewhere so the base rim never glares. */
  private baseFill!: THREE.DirectionalLight;

  // Post-processing: highlight-only bloom (disabled on low-power devices)
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;

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
  private lastHoverAudioTime: number = 0;
  private lastHoveredCanIndex: number = -1;

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
  public isLowPower: boolean = false;
  public readonly packshotMode: boolean;
  public contextLost: boolean = false;
  public isRunning: boolean = true;
  private reqId: number | null = null;
  private lastTime: number = 0;
  private carouselVelocity = 0;

  // Carousel & Wave Variables
  public carousel = {
    spacing: CAROUSEL_CONFIG.spacing,
    target: 0,
    position: 0,
    index: 0,
    lastIndex: 0,
    offset: 0,
    getRounded: () => Math.round(this.carousel.target / this.carousel.spacing) * this.carousel.spacing,
    getIndex: (wrapped: boolean = true) => {
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

  // Pointer parallax
  public pointer = {
    x: 0,
    y: 0,
    smoothX: 0,
    smoothY: 0,
  };

  // Master timeline state data
  public data: Scene3DData = {
    camPosX: 0,
    camPosY: 0,
    camPosZ: 29,
    camRotX: 0,
    camRotY: 0,
    camRotZ: 0,
    fov: 20,
    canScale: 1.2,
    canPosX: 0,
    canPosY: 0,
    canPosZ: 0,
    canRotX: 0,
    canRotY: 0,
    canRotZ: 0,
    canSpin: 0,
    spacing: 1.0,
    wave: 1,
    swirl: 0,
    baseOffset: 3.0,
    lightIntensity: 50,
    lightWidth: 1,
    tintStrength: 1,
    spotIntensity: 0,
    spotY: 3,
    pointerInfluence: 0.15,
    swipeSpeed: 1,
    labelDim: 0,
  };

  // Route Coordination Mode (Phase 2 Commerce)
  public routeMode: 'HOME' | 'PRODUCT' | 'PAGE' = 'HOME';
  public activeProductIndex: number = 0;
  private productScroll = 0;
  private heroLift = 0;
  /** Hero can scale factor so it fits between the header and the title (≤ 1). */
  private heroFit = 1;
  /** Desktop pedestal pose, fitted into the band under the flavor slider. */
  private pedestal = { y: -1.72, scale: 0.62 };
  // Frame-rate governor
  private govStart = 0;
  private govFrames = 0;
  private govStep = 0;
  public onQualityChange?: (level: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  private spinStart = -1e9;
  // Intro: cans rise into the ring after the loader, then the bear "roars" (shake + flash).
  private introArmedAt = -1;
  private introStart = -1e9;
  private roarFired = true;
  public onRoar: (() => void) | null = null;
  private spinOffset = 0;
  /** Reduced motion: no pointer tilt, no spin (set from the app). */
  public reducedMotion = false;
  private contactShadow: THREE.Mesh | null = null;
  private productCanIndex = 0;
  private routeBlend = 1;
  private hasRenderedHome = false;
  private readonly routeFrom = Array.from({ length: 24 }, () => ({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: 0,
  }));
  private readonly routeCameraFrom = new THREE.Vector3(0, 0, 29);
  private readonly tmpVector = new THREE.Vector3();
  private readonly tmpEuler = new THREE.Euler();
  private readonly tmpQuaternion = new THREE.Quaternion();
  public productViewerRotation = { x: 0, y: 0, targetX: 0, targetY: 0 };

  public masterTimeline!: gsap.core.Timeline;
  private targetTimelineProgress = 0;
  private currentTimelineProgress = 0;

  constructor(canvas: HTMLCanvasElement, packshotMode: boolean = false) {
    this.canvas = canvas;
    this.packshotMode = packshotMode;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.isLowPower = width < 1024 || /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

    // Renderer setup
    // Packshot assets are rendered offline at 2× and downsampled into a clean
    // 4K export. The regular experience keeps its adaptive interactive budget.
    const pixelRatio = packshotMode
      ? 2
      : this.isLowPower
        ? Math.min(window.devicePixelRatio, 2.0)
        : Math.min(window.devicePixelRatio, 1.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: packshotMode || !this.isLowPower,
      alpha: true,
      preserveDrawingBuffer: packshotMode,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Scene & Camera (Frozen audit: (0, 0, 29), FOV 20 deg)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 29);

    // Setup PBR Environment
    this.setupEnvironment();

    // Setup Studio Lighting Rig
    this.setupLights();

    // Setup Scene Geometry
    this.setupSceneObjects();

    // Highlight-only bloom
    this.setupComposer(width, height, pixelRatio);

    // Build Master Timeline
    this.buildMasterTimeline();

    // Bind Events
    this.bindEvents();

    // Expose Diagnostic Object in DEV
    if (typeof window !== 'undefined') {
      (window as unknown as { __CIAO_SCENE__: SceneManager }).__CIAO_SCENE__ = this;
    }

    // Start Animation Loop
    this.animate(0);
  }

  /**
   * Dark studio environment: black room, one overhead softbox (rim highlights),
   * one tall strip left (long body reflection), a dimmer strip right and a faint
   * grey floor that matches the CSS fog floor. Deterministic, no HDR download.
   */
  private setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x000000);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const addPanel = (
      width: number,
      height: number,
      radiance: number,
      position: [number, number, number],
      lookAt: [number, number, number] = [0, 0, 0]
    ) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      material.color.setScalar(radiance);
      const panel = new THREE.Mesh(geometry, material);
      panel.position.set(...position);
      panel.lookAt(...lookAt);
      envScene.add(panel);
      geometries.push(geometry);
      materials.push(material);
    };

    addPanel(7, 2.2, 7, [0, 7, 2.5]);
    addPanel(1.1, 9, 2.6, [-6.5, 0.8, 2.5]);
    addPanel(0.7, 9, 0.9, [6.5, 0.8, -1.5]);
    addPanel(24, 24, 0.14, [0, -6, 0]);
    addPanel(12, 7, 2.0, [-2, 2, 14]);

    this.scene.environment = pmremGenerator.fromScene(envScene, 0.035).texture;

    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    pmremGenerator.dispose();
  }

  /**
   * One strong key light from above the camera leaves a hot specular on the top
   * rim of the focused can. A cool back light separates silhouettes. Everything
   * else stays dark; out-of-focus cans are darkened in their material.
   */
  private setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xdfe6ff, 0x101014, 0.12);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff8ef, 0.55);
    this.keyLight.position.set(-1.6, 6.5, 4.2);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xdfe6ff, 1.4);
    this.rimLight.position.set(3.2, 3.5, -5);
    this.scene.add(this.rimLight);

    this.fillLight = new THREE.DirectionalLight(0xe8eef8, 0.18);
    this.fillLight.position.set(2.6, -0.6, 4.0);

    // Weak upward fill: only downward-facing surfaces (the domed can bases) pick it up.
    this.baseFill = new THREE.DirectionalLight(0xdfe4ec, 0.9);
    this.baseFill.position.set(0.5, -6, 3);
    this.scene.add(this.baseFill);
    this.scene.add(this.fillLight);

    this.topChimeLight = new THREE.DirectionalLight(0xffffff, 0);
    this.topChimeLight.position.set(0, 7.0, 2.0);
    this.scene.add(this.topChimeLight);

    this.floorBounceLight = new THREE.PointLight(0x9089d3, 0, 8, 1.2);
    this.floorBounceLight.position.set(0, -2.4, 0.8);
    this.scene.add(this.floorBounceLight);

    // Benefit-chapter spotlights stay registered for the timeline but default off.
    this.spot1 = new THREE.SpotLight(0xffffff, 0, 18, Math.PI / 4.2, 0.65, 0.2);
    this.spot1.position.set(-1.2, 3.8, 4.5);
    this.spot1.target.position.set(0, 0.2, 0.5);
    this.scene.add(this.spot1, this.spot1.target);

    this.spot2 = new THREE.SpotLight(0xffffff, 0, 18, Math.PI / 3.2, 0.65, 0.2);
    this.spot2.position.set(1.5, -2.5, 3.5);
    this.spot2.target.position.set(0, -0.2, 1.2);
    this.scene.add(this.spot2, this.spot2.target);

    this.spot3 = new THREE.SpotLight(0xf2f6ff, 0, 15, Math.PI / 8, 0.72, 0.25);
    this.spot3.position.set(0, 3, 5);
    this.spot3.target.position.set(0, 0.5, 0);
    this.scene.add(this.spot3, this.spot3.target);

    this.ceilingSpot = new THREE.SpotLight(0xffffff, 0, 18, Math.PI / 3.5, 0.65, 0.6);
    this.scene.add(this.ceilingSpot);

    this.heroSpotLight = new THREE.SpotLight(0xfffaee, 0, 22, Math.PI / 4.5, 0.55, 0.35);
    this.scene.add(this.heroSpotLight);
  }

  private setupComposer(width: number, height: number, pixelRatio: number) {
    if (this.isLowPower || this.packshotMode) return;
    const composer = new EffectComposer(this.renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(this.scene, this.camera));

    const baseTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const savePass = new SavePass(baseTarget);
    composer.addPass(savePass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.35, 0.5, 1.25);
    composer.addPass(this.bloomPass);

    const alphaRestore = new ShaderPass(AlphaRestoreShader);
    alphaRestore.uniforms.tBase.value = savePass.renderTarget.texture;
    composer.addPass(alphaRestore);
    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  private renderFrame() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private setupSceneObjects() {
    // Pedestal discs above and below the hero carousel
    this.baseGroup = createBaseDiscs(this.isLowPower);
    this.baseGroup.visible = false;
    this.scene.add(this.baseGroup);

    // Cans ring: two of each flavor, so the visible arc never repeats a flavor
    const canCount = 12;
    const loader = new THREE.TextureLoader();

    // One label + one surface map per flavor: procedural/neutral on frame 0,
    // swapped in place when the files arrive (materials keep their shader).
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const flavorTextures = FLAVORS.map((flavor, i) => {
      const albedo = generateProceduralLabelTexture(i);
      const surface = createNeutralSurfaceTexture();
      const normal = createFlatNormalTexture();
      if (!this.isLowPower) {
        loader.load(flavor.textureUrl.replace('.webp', '-normal.png'), (loaded) => swapImage(normal, loaded));
      }
      loader.load(
        flavor.textureUrl,
        (loaded) => {
          albedo.anisotropy = anisotropy;
          swapImage(albedo, loaded);
        },
        undefined,
        (err) => console.warn(`[Grizzly] Label texture failed for ${flavor.name}:`, err)
      );
      loader.load(
        flavor.surfaceUrl,
        (loaded) => swapImage(surface, loaded),
        undefined,
        (err) => console.warn(`[Grizzly] Surface map failed for ${flavor.name}:`, err)
      );
      return { albedo, surface, normal };
    });

    for (let i = 0; i < canCount; i++) {
      const { albedo, surface, normal } = flavorTextures[i % FLAVORS.length];
      const can = createCanMesh(albedo, surface, this.isLowPower, this.isLowPower ? null : normal);
      setCanAccent(can, FLAVORS[i % FLAVORS.length].theme.secondary);
      this.cans.push(can);
      this.scene.add(can);
    }

    // Soft contact shadow on the hero pedestal under the focused can.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const gradient = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(0.45, 'rgba(0,0,0,0.45)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = gradient;
      sctx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.renderOrder = -1;
    this.scene.add(this.contactShadow);

    this.canHoverInfluence = new Float32Array(canCount);
    this.canIdlePhase = new Float32Array(canCount);
    for (let i = 0; i < canCount; i++) {
      this.canIdlePhase[i] = Math.random() * Math.PI * 2;
    }
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
      const rect = BENEFIT_GLOW_RECTS[Math.max(0, this.benefitGlowIndex)];
      if (this.benefitGlowIndex >= 0) surface.uGlowRect.value.copy(rect);
    }
  }

  /** Holds the hero cans below frame until playIntro() (called when the loader leaves). */
  public armIntro() {
    if (this.reducedMotion) return;
    this.introArmedAt = performance.now();
    this.introStart = Number.POSITIVE_INFINITY;
  }

  public playIntro() {
    if (this.introArmedAt < 0) return;
    this.introArmedAt = -1;
    this.introStart = performance.now();
    this.roarFired = false;
  }

  /** 0 = held below frame, 1 = settled; staggered outward from the centre can. */
  private introProgress(time: number, stepDist: number) {
    if (this.introStart < 0) return 1;
    const local = Math.min(1, Math.max(0, (time - this.introStart - stepDist * 130) / 1250));
    const c = 1.15; // easeOutBack: a small settle past the mark
    return 1 + (c + 1) * (local - 1) ** 3 + c * (local - 1) ** 2;
  }

  /**
   * Fits the hero pedestal into a screen band (CSS px), e.g. from just under the
   * flavor slider to the bottom edge, so the whole disc shows without covering text.
   * Pedestal measurements at scale 1 (world units): height 2.15; its bottom sits
   * 6.28 × scale - 0.61 below the group origin.
   */
  public setPedestalBand(topPx: number, bottomPx: number) {
    const height = window.innerHeight;
    const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.data.camPosZ) / height;
    const topY = (height / 2 - topPx) * unitsPerPx;
    const bottomY = (height / 2 - bottomPx) * unitsPerPx;
    const scale = Math.min(0.8, Math.max(0.3, (topY - bottomY) / 2.15));
    this.pedestal.scale = scale;
    this.pedestal.y = bottomY - 0.61 + 6.28 * scale;
  }

  /**
   * Keeps the focused hero can clear of the HTML title: given the title's top edge
   * in CSS px, lift the ring until the can's lowest point sits a margin above it.
   */
  public setHeroSafeBottom(titleTopPx: number, headerBottomPx = 0) {
    const height = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const distance = (isMobile ? this.data.camPosZ + 6.5 : this.data.camPosZ) - CAROUSEL_CONFIG.heroLift;
    const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance) / height;
    const marginPx = 12; // the flavor name sits just under the can
    const safeY = (height / 2 - (titleTopPx - marginPx)) * unitsPerPx; // world Y of the safe line
    const baseScale = isMobile ? CAROUSEL_CONFIG.heroScaleMobile : CAROUSEL_CONFIG.heroScale;
    // The can spans about ±2.4 × scale (half-height plus the tilted end ellipses).
    // If it can't fit between the logo and the title, shrink it instead of overlapping either.
    const topY = (height / 2 - (headerBottomPx + marginPx * 0.5)) * unitsPerPx;
    const available = headerBottomPx > 0 ? topY - safeY : Number.POSITIVE_INFINITY;
    this.heroFit = Math.min(1, Math.max(0.6, available / (4.8 * baseScale)));
    const scale = baseScale * this.heroFit;
    // Phones use a farther camera and a gentler pitch, so the lower end ellipse is smaller.
    const canBottom = CAROUSEL_CONFIG.yBase + (isMobile ? 0.7 : 0) - 2.4 * scale;
    // May be negative: the can always settles just above the title.
    this.heroLift = safeY - canBottom;
    // Desktop: with spare room, centre the can in it rather than hugging the title
    // (phones keep it close to the title, where the thumb-side copy sits).
    // (Spare room stays above the can: the flavor name sits right under it.)
  }

  /**
   * Steps quality down when the device can't hold ~50 fps: pixel ratio first,
   * then bloom, then the low tier. Never steps back up within a visit.
   */
  private governQuality(rawDelta: number, time: number) {
    if (this.packshotMode || rawDelta <= 0 || rawDelta > 0.5) {
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const ratios = [dpr, dpr * 0.85, Math.min(dpr * 0.75, 1), Math.min(dpr * 0.75, 1), 0.75];
    const ratio = ratios[this.govStep];
    this.renderer.setPixelRatio(ratio);
    this.composer?.setPixelRatio(ratio);
    if (this.govStep >= 3 && this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloomPass = null;
      this.onQualityChange?.('MEDIUM');
    }
    if (this.govStep >= 4) this.onQualityChange?.('LOW');
  }

  /** Pointer tilt strength (doubles the authored influence; off under reduced motion). */
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

  /**
   * Master timeline built from SCENE_SEQUENCE: segment k spans [k, k + 1]; the
   * transition to state k + 1 runs through the middle of the segment so each
   * section holds its pose while it is centred in the viewport.
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
      baseOffset: state.baseOffset,
      lightIntensity: state.lighting.lightIntensity,
      tintStrength: state.lighting.tintStrength,
      spotIntensity: state.lighting.spotIntensity,
      spotY: state.lighting.spotY,
      pointerInfluence: state.lighting.pointerInfluence,
      labelDim: state.lighting.labelDim ?? 0,
    });

    Object.assign(this.data, stateToData(SCENE_STATES[SCENE_SEQUENCE[0].state]));
    for (let k = 1; k < SCENE_SEQUENCE.length; k += 1) {
      this.masterTimeline.to(this.data, { ...stateToData(SCENE_STATES[SCENE_SEQUENCE[k].state]), duration: 0.7 }, k - 0.85);
    }
    // Pad the end so the last waypoint lands exactly on progress 1.
    this.masterTimeline.to(this.data, { duration: 0.15 }, SCENE_SEQUENCE.length - 1.15);
  }

  public seekProgress(progress: number) {
    if (!this.masterTimeline) return;
    this.targetTimelineProgress = Math.max(0, Math.min(1, progress));

    // The ring is only interactive while the hero section is centred.
    const segment = 1 / (SCENE_SEQUENCE.length - 1);
    this.currentMode = progress < segment * 0.5 ? 'hero-carousel' : 'feature-editorial';
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.routeMode !== 'HOME' || (this.data.wave < 0.4 && this.data.swirl < 0.4)) return;
    this.isPointerDown = true;
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.lastDragX = e.clientX;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  private onPointerMoveDrag = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (!this.isDragging && Math.hypot(dx, dy) > 6) {
      this.isDragging = true;
    }
    if (this.isDragging && this.data.wave > 0.4) {
      const stepX = e.clientX - this.lastDragX;
      this.lastDragX = e.clientX;
      const screenRatio = 14 / Math.max(window.innerWidth, 320);
      const deltaWorld = stepX * screenRatio;
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
      // Ignored
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.carousel.target =
        Math.round(this.carousel.position / this.carousel.spacing) * this.carousel.spacing;
    } else if (this.routeMode === 'HOME') {
      if (this.data.swirl > 0.4) {
        this.handleOutroCanClick(e.clientX, e.clientY);
      } else if (this.data.wave > 0.4) {
        this.handleCanClick(e.clientX, e.clientY);
      }
    }
  };

  private handleOutroCanClick = (clientX: number, clientY: number) => {
    this.pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const activeOutroCans = this.cans.slice(0, 6);
    const intersects = this.raycaster.intersectObjects(activeOutroCans, true);
    if (intersects.length === 0) return;

    let clickedCan: THREE.Group | null = null;
    let curr: THREE.Object3D | null = intersects[0].object;
    while (curr) {
      if (activeOutroCans.includes(curr as THREE.Group)) {
        clickedCan = curr as THREE.Group;
        break;
      }
      curr = curr.parent;
    }

    if (!clickedCan) return;
    const canIndex = activeOutroCans.indexOf(clickedCan);
    if (canIndex >= 0 && canIndex < 6) {
      this.carousel.goTo(canIndex);
      const pentatonicScale = [330, 370, 415, 494, 554, 659];
      audioManager.playCanHover(pentatonicScale[canIndex], 0.28);
    }
  };

  private handleCanClick = (clientX: number, clientY: number) => {
    this.pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const intersects = this.raycaster.intersectObjects(this.cans, true);
    if (intersects.length === 0) return;

    let clickedCan: THREE.Group | null = null;
    let curr: THREE.Object3D | null = intersects[0].object;
    while (curr) {
      if (this.cans.includes(curr as THREE.Group)) {
        clickedCan = curr as THREE.Group;
        break;
      }
      curr = curr.parent;
    }

    if (!clickedCan) return;
    const canIndex = this.cans.indexOf(clickedCan);
    const target = canIndex * this.carousel.spacing - this.carousel.position;
    const minX = (this.cans.length * -0.5) * this.carousel.spacing;
    const maxX = (this.cans.length * 0.5) * this.carousel.spacing;
    const range = maxX - minX;
    const x = ((((target - minX) % range) + range) % range) + minX;

    if (Math.abs(x) < 0.65 * this.carousel.spacing) {
      this.onHeroCanClicked?.();
    } else {
      const stepOffset = Math.round(x / this.carousel.spacing);
      this.carousel.target += stepOffset * this.carousel.spacing;
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (this.routeMode !== 'HOME' || this.data.wave < 0.6) return;
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (isHorizontal && Math.abs(e.deltaX) > 12) {
      e.preventDefault();
      const dir = Math.sign(e.deltaX);
      this.carousel.target += dir * this.carousel.spacing;
    }
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

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
    });

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
    });
  }

  /**
   * Route switch. Entering a product carries the featured can over: every can's
   * current transform is captured and the loop blends from it to the product pose
   * (the others shrink away), so the can appears to travel from the home scene.
   */
  public setRoute(mode: 'HOME' | 'PRODUCT' | 'PAGE', productSlug?: string) {
    const previous = this.routeMode;
    this.routeMode = mode;
    if (mode === 'PAGE') {
      // Plain pages (bag, checkout, mix, story, 404): no cans; clear once and idle.
      this.renderer.clear();
      return;
    }
    if (mode !== 'PRODUCT') return;

    const index = FLAVORS.findIndex((flavor) => flavor.id === productSlug);
    if (index !== -1) this.activeProductIndex = index;
    this.productViewerRotation = { x: 0, y: 0, targetX: 0, targetY: 0 };

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
  }

  /** Product page scroll (in viewport heights); on narrow screens the can scrolls away with the hero. */
  public setProductScroll(progress: number) {
    this.productScroll = Math.max(0, progress);
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
    // Face the benefits panel: u = 0.5 faces the camera at rotY 0 (pose yaw is added on top).
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
    this.composer?.setSize(width, height);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.pointer.x = e.clientX - window.innerWidth / 2;
    this.pointer.y = e.clientY - window.innerHeight / 2;

    // Project pointer into exact 3D world space at z=0 for hover proximity.
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const halfH = Math.tan(fovRad * 0.5) * this.camera.position.z;
    const halfW = halfH * this.camera.aspect;
    this.pointerLightTarget.x = ndcX * halfW;
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

  public animate = (time: number) => {
    this.reqId = requestAnimationFrame(this.animate);
    if (!this.isRunning || this.contextLost) return;

    const rawDelta = (time - this.lastTime) / 1000;
    const delta = Math.min(rawDelta, 0.05);
    this.lastTime = time;
    this.governQuality(rawDelta, time);

    // Frame-rate independent damping keeps scroll, pointer, and product motion
    // consistent on 60 Hz, high refresh, and throttled mobile displays.
    const pointerBlend = 1 - Math.exp(-12 * delta);
    this.pointer.smoothX += (this.pointer.x - this.pointer.smoothX) * pointerBlend;
    this.pointer.smoothY += (this.pointer.y - this.pointer.smoothY) * pointerBlend;

    const timelineBlend = 1 - Math.exp(-14 * delta);
    this.currentTimelineProgress += (this.targetTimelineProgress - this.currentTimelineProgress) * timelineBlend;
    if (Math.abs(this.targetTimelineProgress - this.currentTimelineProgress) > 0.0001) {
      this.masterTimeline.seek(this.currentTimelineProgress * this.masterTimeline.duration());
    } else if (this.masterTimeline.progress() !== this.targetTimelineProgress) {
      this.currentTimelineProgress = this.targetTimelineProgress;
      this.masterTimeline.seek(this.currentTimelineProgress * this.masterTimeline.duration());
    }

    // Critically damped spring gives can travel a soft, physical start and stop
    // without the frame-rate-dependent snap of a direct lerp.
    const springFrequency = 16;
    const springError = this.carousel.position - this.carousel.target;
    const springImpulse = this.carouselVelocity + springFrequency * springError;
    const springDecay = Math.exp(-springFrequency * delta);
    this.carousel.position = this.carousel.target +
      (springError + springImpulse * delta) * springDecay;
    this.carouselVelocity =
      (this.carouselVelocity - springFrequency * springImpulse * delta) * springDecay;
    if (Math.abs(springError) < 0.0005 && Math.abs(this.carouselVelocity) < 0.005) {
      this.carousel.position = this.carousel.target;
      this.carouselVelocity = 0;
    }
    const currentIdx = this.carousel.getIndex();
    if (currentIdx !== this.carousel.lastIndex) {
      this.carousel.listeners.forEach((cb) =>
        cb({ index: currentIdx, previous: this.carousel.lastIndex })
      );
      this.carousel.lastIndex = currentIdx;
      if (!this.reducedMotion) this.spinStart = time;
    }
    // One full turn of the focused can when the flavor changes.
    const spinT = (time - this.spinStart) / 900;
    this.spinOffset = spinT >= 0 && spinT < 1 ? (spinT < 0.5 ? 4 * spinT ** 3 : 1 - (-2 * spinT + 2) ** 3 / 2) * Math.PI * 2 : 0;
    // Condensation reads strongest in the hero and on the product page.
    const dropTarget = this.routeMode === 'PRODUCT' ? 1 : 0.4 + 0.6 * this.data.wave;
    condensation.uDropStrength.value += (dropTarget - condensation.uDropStrength.value) * (1 - Math.exp(-4 * delta));
    if (this.routeMode === 'PAGE') return;
    if (this.routeMode === 'PRODUCT') {
      this.renderProduct(delta, time);
      return;
    }
    this.hasRenderedHome = true;

    // Apply Camera state with mobile compensation
    const isMobile = window.innerWidth < 768;
    this.camera.fov = this.data.fov;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(
      this.data.camPosX,
      this.data.camPosY,
      isMobile ? this.data.camPosZ + (this.data.wave > 0.5 ? 6.5 : 2) : this.data.camPosZ
    );
    this.camera.rotation.set(this.data.camRotX, this.data.camRotY, this.data.camRotZ);

    // Intro safety net: never leave the cans parked if the loader never reports.
    if (this.introArmedAt >= 0 && time - this.introArmedAt > 8000) this.playIntro();
    const roarT = (time - this.introStart - 1150) / 420;
    if (!this.roarFired && roarT >= 0) {
      this.roarFired = true;
      this.onRoar?.();
    }
    if (roarT >= 0 && roarT < 1) {
      const shake = (1 - roarT) ** 2 * 0.07;
      this.camera.position.x += Math.sin(time * 0.09) * shake;
      this.camera.position.y += Math.cos(time * 0.11) * shake;
      // a hard white flash from above, like a photographer's strobe
      this.heroSpotLight.intensity = (1 - roarT) ** 3 * 60;
      this.heroSpotLight.position.set(this.data.canPosX, this.data.canPosY + 9, this.data.canPosZ + 6);
      this.heroSpotLight.target.position.set(this.data.canPosX, this.data.canPosY, this.data.canPosZ);
      this.heroSpotLight.target.updateMatrixWorld();
    } else if (roarT >= 1 && this.introStart > -1e8) {
      this.heroSpotLight.intensity = 0;
      if (time - this.introStart > 3500) this.introStart = -1e9;
    }

    // Benefit label glow: flavor-coloured, one block at a time, damped.
    const activeFlavor = FLAVORS[this.carousel.getIndex()];
    const glowTarget = this.benefitGlowIndex >= 0 ? 1 : 0;
    this.benefitGlowStrength += (glowTarget - this.benefitGlowStrength) * (1 - Math.exp(-6 * delta));
    if (activeFlavor) this.glowColor.set(activeFlavor.theme.secondary);

    this.baseFill.intensity = 0.2 + 0.7 * this.data.wave;

    // Back light picks up the flavor colour, like a coloured gel behind a product shot.
    this.rimTint.copy(this.rimBase).lerp(this.glowColor, 0.55);
    this.rimLight.color.lerp(this.rimTint, 1 - Math.exp(-4 * delta));

    // Flavor change: a soft-box glint sweeps across the featured can, left to right.
    const glintT = (time - this.spinStart) / 1100;
    if (glintT >= 0 && glintT < 1) {
      this.topChimeLight.intensity = Math.sin(Math.PI * glintT) ** 2 * 2.2;
      this.topChimeLight.position.set(this.data.canPosX - 7 + glintT * 14, this.data.canPosY + 3, this.data.canPosZ + 6);
      this.topChimeLight.target.position.set(this.data.canPosX, this.data.canPosY, this.data.canPosZ);
      this.topChimeLight.target.updateMatrixWorld();
    } else if (this.topChimeLight.intensity !== 0) {
      this.topChimeLight.intensity = 0;
    }

    // Responsive Carousel Spacing
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
    this.keyLight.position.set(this.data.canPosX - 1.6 + pointerX * 3, this.data.canPosY + 6.5 - pointerY * 2, this.data.canPosZ + 4.2);
    this.keyLight.target.position.set(this.data.canPosX, this.data.canPosY, this.data.canPosZ);
    this.keyLight.target.updateMatrixWorld();

    // Ceiling fixture & floor pedestal (Phase 3 Hero Installation):
    // In Hero (wave > 0.05), the authentic industrial ceiling disc hangs above the carousel
    // and the dark machined steel floor pedestal grounds the center hero can.
    // As the user scrolls into Profile (wave drops 1.0 -> 0.0), they smoothly slide vertically offscreen.
    if (this.baseGroup) {
      if (this.data.wave > 0.02) {
        this.baseGroup.visible = true;
        const floor = this.baseGroup.children[0];
        const ceiling = this.baseGroup.children[1];
        const retract = 1 - this.data.wave;
        const mobileFloorY = isMobile ? -2.05 : this.pedestal.y;
        const mobileCeilY = 9; // the top disc stays out of frame: it clipped into the header
        if (floor) {
          floor.position.y = mobileFloorY - retract * 8.0;
          // Desktop: a slightly smaller pedestal so the whole disc fits under the slider.
          floor.scale.setScalar(isMobile ? 1 : this.pedestal.scale);
        }
        if (ceiling) ceiling.position.y = mobileCeilY + this.heroLift - retract * 8.0;
      } else {
        this.baseGroup.visible = false;
      }
    }

    if (this.contactShadow && this.baseGroup) {
      const floorTop = this.baseGroup.children[0].position.y - 3.33;
      const material = this.contactShadow.material as THREE.MeshBasicMaterial;
      material.opacity = 0.75 * Math.max(0, this.data.wave * 2 - 1);
      this.contactShadow.visible = material.opacity > 0.01 && !isMobile;
      this.contactShadow.position.set(0, floorTop, CAROUSEL_CONFIG.heroLift * this.data.wave);
      this.contactShadow.scale.set(2.8, 1.6, 1);
    }

    // Apply Can Wave Positions & Rotations (Frozen Reference Formulas)
    const minX = (this.cans.length * -0.5) * this.carousel.spacing;
    const maxX = (this.cans.length * 0.5) * this.carousel.spacing;

    const wrap = (val: number, min: number, max: number) => {
      const range = max - min;
      return ((((val - min) % range) + range) % range) + min;
    };

    let maxHoverInfluence = 0;
    let bestHoverCanIndex = -1;

    this.cans.forEach((can, i) => {
      // Swirl / Outro Packshot: Symmetrical 6-can regal lineup matching reference (media_1790839400814.png)
      const target = i * this.carousel.spacing - this.carousel.position;
      const x = wrap(target, minX, maxX);
      const stepDist = Math.abs(x) / this.carousel.spacing;
      const centerWeight = Math.max(0, 1 - stepDist);
      const p = centerWeight * centerWeight * (3 - 2 * centerWeight);

      // Lineup: every can on one rising diagonal, leaning like dominoes, nearer at
      // the bottom left. Blends from the featured pose as swirl goes 0 -> 1.
      if (this.data.swirl > 0.01) {
        const s = this.data.swirl;
        // Each flavor once, in catalog order: the first set of cans fills the row,
        // the duplicate set (ring only) leaves as the lineup forms.
        const count = FLAVORS.length;
        const isDuplicate = i >= count;
        const t = (i % count) - (count - 1) / 2;
        const absT = Math.abs(t);
        const step = isMobile ? 0.82 : 1.62;
        const targetX = t * step - (isMobile ? 0.35 : 0);
        const targetY = -0.4 + t * step * 0.3;
        const targetZ = -t * step * 0.55;
        const phase = this.canIdlePhase[i];
        const breathY = Math.sin(time * 0.0008 + phase) * 0.012;
        const isFeatured = p > 0.4;
        const fromScale = isFeatured ? this.data.canScale : 0;

        can.visible = isDuplicate ? isFeatured && s < 0.25 : isFeatured || s > 0.25;
        can.position.set(
          this.data.canPosX * (1 - s) + targetX * s,
          this.data.canPosY * (1 - s) + (targetY + breathY) * s,
          this.data.canPosZ * (1 - s) + targetZ * s
        );
        can.rotation.set(
          this.data.canRotX * (1 - s) + 0.12 * s,
          this.data.canRotY * (1 - s) + 0.18 * s,
          this.data.canRotZ * (1 - s) - 0.22 * s
        );
        // Phones: a smaller row so all six cans fit the narrow frame.
        const canScale = fromScale * (1 - s) + this.data.canScale * (isMobile ? 0.55 : 1) * s;
        can.scale.set(canScale, canScale, canScale);

        // Ends fade gently; every label stays recognisable.
        const edgeFade = 1 - 0.4 * Math.pow(absT / ((count - 1) / 2), 2);
        setCanFocus(can, Math.round(Math.max(0.02, (isFeatured ? 1 - s : 0) + s * edgeFade) * 100) / 100);
        this.applyLabelState(can, false);
        return;
      }


      // MODE B — FEATURE EDITORIAL:
      // When wave is near 0, strictly display ONE single large 3D can in editorial presentation.
      // All other cans recede completely and are hidden.
      if (this.currentMode === 'feature-editorial' && this.data.wave < 0.15) {
        const isFeatured = p > 0.4;
        can.visible = isFeatured;
        if (!isFeatured) {
          can.position.set(0, -999, 0);
          return;
        }

        let featX = this.data.canPosX;
        let featY = this.data.canPosY;
        const featZ = this.data.canPosZ;
        let featScale = this.data.canScale;
        let featRotX = this.data.canRotX;
        let featRotY = this.data.canRotY + this.data.canSpin;
        const featRotZ = this.data.canRotZ;

        if (isMobile) {
          // Phones: benefit chapters keep the label at 0.58 so it clears the copy; the
          // flavor intro and the tagline scene keep a bigger can (blended through labelDim).
          featScale *= 0.7 - 0.12 * this.data.labelDim;
          featY += 1.45; // phones: copy sits at the bottom, so the can rides higher
          featX = 0.58;
        }

        // Parallax pointer influence
        featRotY += (this.pointer.smoothX / 1280) * this.tilt();
        featRotX += (this.pointer.smoothY / 1280) * this.tilt();

        setCanFocus(can, 1);
        this.applyLabelState(can, true);

        can.position.set(featX, featY, featZ);
        can.rotation.set(featRotX, featRotY, featRotZ);
        can.scale.set(featScale, featScale, featScale);
        return;
      }

      const heroScale = (isMobile ? CAROUSEL_CONFIG.heroScaleMobile : CAROUSEL_CONFIG.heroScale) * this.heroFit;
      const ringRadius = isMobile ? CAROUSEL_CONFIG.ringRadiusMobile : CAROUSEL_CONFIG.ringRadius;
      const heroWeight = Math.max(0, 1 - stepDist * 1.15);
      const heroWeightSmooth = heroWeight * heroWeight * (3 - 2 * heroWeight);

      // Position on a shallow, symmetric arc; cans past the visible slots shrink away.
      const theta = x / ringRadius;
      const ringX = Math.sin(theta) * ringRadius;
      const ringZ = (Math.cos(theta) - 1) * ringRadius;
      const visibleSlots = isMobile ? CAROUSEL_CONFIG.visibleSlotsMobile : CAROUSEL_CONFIG.visibleSlots;
      const edge = Math.min(1, Math.max(0, (visibleSlots + 0.45 - stepDist) / 0.9));
      const edgeFade = edge * edge * (3 - 2 * edge);
      const ringArc = CAROUSEL_CONFIG.ringArc * Math.min(stepDist, 3) ** 2;
      // Neighbours are smaller than the centre can and shrink further toward the edges.
      let canScale = heroScale * (0.78 + 0.22 * heroWeightSmooth) * (0.6 + 0.4 * edgeFade);
      let canPosX = ringX * this.data.wave;
      let canPosY = (CAROUSEL_CONFIG.yBase + (isMobile ? 0.7 : 0) + this.heroLift + ringArc) * this.data.wave;
      let canPosZ = (ringZ + CAROUSEL_CONFIG.heroLift * heroWeightSmooth - (1 - edgeFade) * 3) * this.data.wave;

      const pitch = CAROUSEL_CONFIG.pitchNeighbour + (CAROUSEL_CONFIG.pitchX - CAROUSEL_CONFIG.pitchNeighbour) * heroWeightSmooth;
      let canRotX = pitch * this.data.wave;
      let canRotY = (CAROUSEL_CONFIG.yawHeroY + theta * CAROUSEL_CONFIG.labelTurn * (1 - heroWeightSmooth)) * this.data.wave;
      let canRotZ = (CAROUSEL_CONFIG.rollZ * heroWeightSmooth + Math.sin(theta) * CAROUSEL_CONFIG.neighbourLean) * this.data.wave;

      let targetSectionScale = this.data.canScale;
      let targetSectionPosY = this.data.canPosY;
      let targetSectionPosX = this.data.canPosX;

      if (isMobile && this.data.wave < 0.5) {
        targetSectionScale *= 0.65;
        targetSectionPosY += 1.0;
        targetSectionPosX = targetSectionPosX * 0.2;
      }

      can.visible = (this.data.wave >= 0.8 && edgeFade > 0.02) || p > 0.4;

      const collapseBlend = Math.max(0, 1 - this.data.wave);
      canScale = canScale + (targetSectionScale - canScale) * collapseBlend;
      canPosY = canPosY + (targetSectionPosY - canPosY) * collapseBlend;
      canPosZ = canPosZ + (this.data.canPosZ - canPosZ) * collapseBlend;
      canPosX = canPosX + (targetSectionPosX - canPosX) * collapseBlend;

      // Only the centre can is lit; neighbours fall almost to black.
      // Depth falloff: the focused can is fully lit, neighbours step into the dark.
      const ringFocus = (0.14 + 0.24 * Math.max(0, 1 - stepDist / 3)) * edgeFade + (0.62 * heroWeightSmooth);
      const focus = Math.max(ringFocus, p * collapseBlend);
      setCanFocus(can, Math.round(focus * 100) / 100);
      this.applyLabelState(can, p > 0.4);

      canRotX += this.data.canRotX * collapseBlend;
      canRotY += this.data.canRotY * collapseBlend;
      canRotZ += this.data.canRotZ * collapseBlend;

      canRotY += this.data.canSpin * p;

      canRotY += (this.pointer.smoothX / 1280) * this.tilt() * p + this.spinOffset * p;
      canRotX += (this.pointer.smoothY / 1280) * this.tilt() * p;

      // ── Per-can hover proximity interaction ──────────────────────
      // Each can reacts to pointer closeness with physical tilt, lift,
      // and z-push. Exponentially damped for buttery 60→240 Hz motion.
      if (!isMobile && can.visible && this.data.wave > 0.3) {
        // Project can world position to rough screen-space
        const canScreenX = canPosX - this.camera.position.x;
        const canScreenY = canPosY - this.camera.position.y;
        const ptrWorldX = this.pointerLightTarget.x;
        const ptrWorldY = this.pointerLightTarget.y;
        const dx = canScreenX - ptrWorldX;
        const dy = canScreenY - ptrWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Proximity falls off over ~3 world units (one can spacing)
        const proximityRadius = this.carousel.spacing * 0.85;
        const rawInfluence = Math.max(0, 1 - dist / proximityRadius);
        const targetHover = rawInfluence * rawInfluence; // quadratic falloff

        // Frame-rate independent smooth damping
        const hoverBlend = 1 - Math.exp(-8 * delta);
        this.canHoverInfluence[i] += (targetHover - this.canHoverInfluence[i]) * hoverBlend;
        const h = this.canHoverInfluence[i];

        if (h > maxHoverInfluence) {
          maxHoverInfluence = h;
          bestHoverCanIndex = i;
        }

        // Physical response: tilt toward pointer, lift up, push forward
        if (h > 0.01) {
          const tiltX = -dy * 0.08 * h; // tilt away from pointer Y
          const tiltY = dx * 0.06 * h;  // tilt toward pointer X
          canRotX += tiltX;
          canRotY += tiltY;
          canPosY += h * 0.12;  // subtle lift
          canPosZ += h * 0.35;  // push toward camera
          canScale *= 1 + h * 0.06; // slight scale-up on proximity
        }
      } else if (this.canHoverInfluence[i] > 0.001) {
        // Decay hover when not applicable
        this.canHoverInfluence[i] *= 1 - Math.min(1, 6 * delta);
      }

      // ── Idle micro-breathing ─────────────────────────────────────
      // Subtle organic bobbing so cans never feel static/frozen.
      // GPU-friendly: transform-only, no layout triggers.
      if (can.visible && this.data.wave > 0.3) {
        const phase = this.canIdlePhase[i];
        const breathSpeed = 0.0008; // very slow
        const breathY = Math.sin(time * breathSpeed + phase) * 0.025;
        const breathRot = Math.cos(time * breathSpeed * 0.7 + phase) * 0.008;
        canPosY += breathY;
        canRotZ += breathRot;
      }

      if (this.introStart > -1e8) {
        const rise = this.introProgress(time, stepDist);
        canPosY -= (1 - rise) * 7.5;
        canRotY += (1 - rise) * 2.2;
      }

      // Apply unified transforms to the parent can Group
      can.position.set(canPosX, canPosY, canPosZ);
      can.rotation.set(canRotX, canRotY, canRotZ);
      can.scale.set(canScale, canScale, canScale);
    });

    // ── Resonant Chime on Can Proximity Transition ───────────────
    if (!isMobile && (this.data.wave > 0.3 || this.data.swirl > 0.5)) {
      if (maxHoverInfluence > 0.12 && bestHoverCanIndex !== -1) {
        if (this.lastHoveredCanIndex !== bestHoverCanIndex && (time - this.lastHoverAudioTime > 80)) {
          this.lastHoveredCanIndex = bestHoverCanIndex;
          this.lastHoverAudioTime = time;
          const pentatonicScale = [330, 370, 415, 494, 554, 659];
          const note = pentatonicScale[((bestHoverCanIndex % 6) + 6) % 6];
          audioManager.playCanHover(note, 0.22);
        }
      } else if (maxHoverInfluence < 0.03) {
        this.lastHoveredCanIndex = -1;
      }
    }

    this.renderFrame();
  };

  /**
   * Product page pose: one large can, left of the purchase panel on desktop and
   * above it on narrow screens. Blends in from the captured home transforms.
   */
  private renderProduct(delta: number, time: number) {
    const isNarrow = window.innerWidth < 1024;
    const viewerBlend = 1 - Math.exp(-8 * delta);
    const rotation = this.productViewerRotation;
    rotation.x += (rotation.targetX - rotation.x) * viewerBlend;
    rotation.y += (rotation.targetY - rotation.y) * viewerBlend;

    this.routeBlend += (1 - this.routeBlend) * (1 - Math.exp(-3.6 * delta));
    const t = this.routeBlend;
    const eased = t * t * (3 - 2 * t);

    // Camera: same lens as the home scene so the can keeps its scale while travelling.
    const camera = this.packshotMode ? PACKSHOT_CAMERA : PRODUCT_CAMERA;
    this.camera.fov = camera.fov;
    this.camera.updateProjectionMatrix();
    this.tmpVector.set(camera.x, camera.y, camera.z);
    this.camera.position.lerpVectors(this.routeCameraFrom, this.tmpVector, this.packshotMode ? 1 : eased);
    this.camera.rotation.set(0, 0, 0);

    if (this.baseGroup) this.baseGroup.visible = false;
    if (this.contactShadow) this.contactShadow.visible = false;

    const pose = this.packshotMode ? PACKSHOT_POSE : isNarrow ? PRODUCT_POSE_NARROW : PRODUCT_POSE;
    const sway = this.packshotMode ? 0 : Math.sin(time * 0.0006) * 0.03;
    const scrollLift = isNarrow ? this.productScroll * 7 : 0;
    this.tmpEuler.set(pose.rotX + rotation.x, pose.rotY + rotation.y + sway, pose.rotZ);
    this.tmpQuaternion.setFromEuler(this.tmpEuler);

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
          surface.uGlowColor.value.set(FLAVORS[this.activeProductIndex].theme.secondary);
          if (this.benefitGlowIndex >= 0) surface.uGlowRect.value.copy(BENEFIT_GLOW_RECTS[this.benefitGlowIndex]);
        }
      } else {
        // The rest of the ring clears out quickly so the featured can travels alone.
        const scale = from.scale * Math.max(0, 1 - eased * 3);
        can.visible = scale > 0.01;
        if (can.visible) setCanFocus(can, Math.round(Math.max(0, 0.1 - eased) * 100) / 100);
        if (can.visible) can.scale.setScalar(scale);
      }
    });

    this.renderFrame();
  }

  /**
   * Diagnostic Report (Development Mode Inspector)
   */
  public getDiagnosticReport() {
    const firstShell = this.cans[0]?.getObjectByName('Shell') as THREE.Mesh;
    const mat = firstShell?.material as THREE.MeshPhysicalMaterial;
    return {
      canCount: this.cans.length,
      firstCanChildren: this.cans[0]?.children.map((c) => c.name),
      environmentActive: !!this.scene.environment,
      rendererExposure: this.renderer.toneMappingExposure,
      cameraPos: this.camera.position.toArray(),
      cameraFov: this.camera.fov,
      material: mat
        ? {
            metalness: mat.metalness,
            roughness: mat.roughness,
            clearcoat: mat.clearcoat,
            envMapIntensity: mat.envMapIntensity,
            hasMap: !!mat.map,
            mapColorSpace: mat.map?.colorSpace,
          }
        : null,
      lights: {
        ambient: this.ambientLight?.intensity,
        hemi: this.hemiLight?.intensity,
        key: this.keyLight?.intensity,
        rim: this.rimLight?.intensity,
        fill: this.fillLight?.intensity,
        spot1: this.spot1?.intensity,
        spot2: this.spot2?.intensity,
      },
    };
  }

  /**
   * Smart Quality Adaptation (HIGH / MEDIUM / LOW / STATIC)
   */
  public setQuality(level: 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC') {
    if (level === 'STATIC') {
      this.isRunning = false;
      return;
    }
    this.isRunning = true;
    // Device pixel ratio is capped; exposure stays constant so lighting is identical per tier.
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cap = level === 'LOW' ? 1 : level === 'MEDIUM' ? 1.25 : 1.5;
    const pixelRatio = Math.min(dpr, cap);
    this.renderer.setPixelRatio(pixelRatio);
    this.composer?.setPixelRatio(pixelRatio);
    if (level === 'LOW' && this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloomPass = null;
    }
  }

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

    this.composer?.dispose();
    this.scene.environment?.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
  }
}
