import * as THREE from 'three';

/**
 * The night stage behind the cans: black sky, a cold moon glow, three layers of ridge-line
 * mountains in blue fog, a wet black floor and low drifting mist. One idea ("cold power from the
 * wild") rendered as a single backdrop that reacts to the camera and scroll.
 *
 * Cost control: the heavy part (noise ridges and fog) is drawn into a half-resolution render
 * target; the visible quad only upsamples it and adds fine stars and dither. The foreground mist
 * is a second, cheaper quad drawn over the cans' feet.
 */
const FULLSCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

const NOISE = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }
  float ridged(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < RIDGE_OCTAVES; i++) {
      float n = vnoise(p);
      v += a * (1.0 - abs(2.0 * n - 1.0));
      p = p * 2.1 + vec2(3.7, 1.3);
      a *= 0.48;
    }
    return v;
  }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHorizon;
  uniform vec2 uCam;          // camera x / y in world units (parallax)
  uniform float uScroll;      // 0..9 section position
  uniform vec3 uAccent;
  uniform vec3 uAccentPrev;
  uniform float uWipe;        // 0..1 colour wave radius
  uniform vec2 uWipeOrigin;   // uv of the wave centre
  uniform float uMoon;        // moon glow strength
  uniform float uMountains;   // 0 hides the ridges (close-up chapters), 1 full
  uniform float uMist;
  uniform float uFlash;       // roar flash
  uniform float uGlow;        // accent glow pool under the focused can
  uniform vec2 uGlowPos;
  ${NOISE}

  vec3 ridgeLayer(vec3 base, vec2 uv, float level, float freq, float amp, float seed, float par, float fog, vec3 tint, float rim) {
    float x = uv.x * uAspect + uCam.x * par * 0.05 + uScroll * par * 0.03;
    float h = uHorizon + level + amp * (ridged(vec2(x * freq, seed)) - 0.5) - uCam.y * par * 0.012;
    float px = 1.2 / 540.0;
    float mask = smoothstep(h + px, h - px, uv.y);
    // light from the moon side: brighten slopes facing it, ice on the high peaks
    float dh = ridged(vec2((x + 0.01) * freq, seed)) - ridged(vec2((x - 0.01) * freq, seed));
    float lit = clamp(0.5 + dh * 6.0, 0.0, 1.0);
    float depth = clamp((h - uv.y) / (amp * 0.9 + 0.001), 0.0, 1.0);
    vec3 rock = mix(tint * 0.6, tint * (0.6 + 0.9 * lit), 1.0 - depth * 0.5);
    rock += vec3(0.5, 0.65, 0.95) * 0.05 * smoothstep(0.4, 0.0, depth) * lit;      // snow on the crest
    rock = mix(rock, vec3(0.006, 0.012, 0.024), fog * (0.35 + 0.65 * depth));
    float edge = exp(-abs(uv.y - h) * 260.0) * rim;
    vec3 col = mix(base, rock, mask);
    col += uAccent * edge * 0.12 * mask;
    return col;
  }

  void main() {
    vec2 uv = vUv;
    float asp = uAspect;
    float t = uTime;

    // sky: near-black zenith to a cold, faintly lit horizon
    float sky = smoothstep(0.0, 1.0, (uv.y - uHorizon) / (1.0 - uHorizon + 0.001));
    vec3 col = mix(vec3(0.0042, 0.0095, 0.019), vec3(0.0004, 0.0007, 0.0016), pow(sky, 0.5));

    // moon glow (right of centre) tinted a little toward the flavor
    vec2 moonPos = vec2(0.70 + uCam.x * 0.004, 0.72 - uCam.y * 0.004);
    float md = length((uv - moonPos) * vec2(asp, 1.0));
    vec3 moonCol = mix(vec3(0.42, 0.58, 0.9), uAccent, 0.25);
    col += moonCol * (0.016 * exp(-md * 3.2) + 0.22 * exp(-md * 38.0)) * uMoon;

    // high thin cloud bands, drifting
    float cl = fbm(vec2(uv.x * asp * 1.6 + t * 0.008, uv.y * 7.0 + uScroll * 0.1));
    col += vec3(0.006, 0.011, 0.02) * smoothstep(0.5, 0.9, cl) * smoothstep(uHorizon, 1.0, uv.y) * uMoon;

    // mountains: far, mid, near (parallax grows toward the camera)
    float m = uMountains;
    float farFog = 0.7;
    col = ridgeLayer(col, uv, 0.20 * m - 0.05, 1.4, 0.26 * m, 3.1, 0.5, farFog, vec3(0.018, 0.034, 0.06), 0.35);
    float band = fbm(vec2(uv.x * asp * 2.2 - t * 0.012, uv.y * 4.0));
    col = mix(col, vec3(0.012, 0.024, 0.045), 0.4 * band * smoothstep(uHorizon + 0.3, uHorizon, uv.y) * m);
    col = ridgeLayer(col, uv, 0.08 * m - 0.04, 2.3, 0.2 * m, 7.9, 1.0, 0.5, vec3(0.010, 0.019, 0.034), 0.5);
    col = ridgeLayer(col, uv, -0.02 * m - 0.03, 3.4, 0.14 * m, 12.4, 1.8, 0.25, vec3(0.003, 0.006, 0.011), 0.8);

    // floor: wet black stone that catches a cold sheen near the horizon
    float below = uHorizon - uv.y;
    if (below > 0.0) {
      float k = clamp(below / uHorizon, 0.0, 1.0);
      vec3 floorCol = mix(vec3(0.0042, 0.0085, 0.017), vec3(0.0004, 0.0006, 0.0012), pow(k, 0.45));
      float sheen = fbm(vec2(uv.x * asp * 5.0 + t * 0.01, k * 24.0)) ;
      floorCol += vec3(0.004, 0.008, 0.015) * smoothstep(0.45, 0.95, sheen) * (1.0 - k);
      // moon column mirrored in the wet floor
      floorCol += moonCol * 0.012 * exp(-abs((uv.x - moonPos.x) * asp) * 7.0) * (1.0 - k) * uMoon;
      col = mix(col, floorCol, smoothstep(0.0, 0.012, below));
    }

    // low mist rolling across the horizon
    float mist = fbm(vec2(uv.x * asp * 1.7 + t * 0.02, uv.y * 6.0 - t * 0.004));
    float mistMask = smoothstep(0.32, 0.0, abs(uv.y - uHorizon + 0.02)) * (0.35 + 0.9 * mist);
    col += vec3(0.010, 0.018, 0.03) * mistMask * uMist;

    // flavor colour wave: the new accent floods outward from the wave origin
    vec2 wv = (uv - uWipeOrigin) * vec2(asp, 1.0);
    float wd = length(wv);
    float radius = uWipe * 2.4;
    float inside = smoothstep(radius, radius - 0.35, wd);
    vec3 accent = mix(uAccentPrev, uAccent, inside);
    float front = exp(-pow((wd - radius) * 3.2, 2.0)) * (1.0 - uWipe) * step(0.001, uWipe);
    col += uAccent * front * 0.2;

    // accent glow pool (under / behind the focused can) and the rim light on the ridges
    float gd = length((uv - uGlowPos) * vec2(asp, 1.0));
    col += accent * (0.035 * exp(-gd * 2.6) + 0.1 * exp(-gd * 8.0)) * uGlow;
    col += accent * 0.003 * (1.0 - sky);

    col += vec3(0.8, 0.9, 1.0) * uFlash * (0.25 + 0.5 * exp(-md * 2.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const DISPLAY_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tBackdrop;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHorizon;
  uniform float uStars;
  ${NOISE}
  void main() {
    vec3 col = texture2D(tBackdrop, vUv).rgb;
    // fine stars: sparse, only well above the horizon, slow twinkle
    vec2 cell = floor(vec2(vUv.x * uAspect, vUv.y) * 90.0);
    float h = hash21(cell);
    vec2 local = fract(vec2(vUv.x * uAspect, vUv.y) * 90.0) - 0.5;
    float star = step(0.9965, h) * smoothstep(0.22, 0.0, length(local));
    star *= 0.55 + 0.45 * sin(uTime * (0.4 + h * 2.0) + h * 40.0);
    col += vec3(0.7, 0.8, 1.0) * star * smoothstep(uHorizon + 0.12, uHorizon + 0.5, vUv.y) * uStars * 0.9;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const MIST_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHorizon;
  uniform float uAmount;
  uniform float uBurst;       // 0..1 pressurised burst of mist (opening, roar)
  uniform vec2 uBurstPos;
  uniform vec3 uAccent;
  ${NOISE}
  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float n1 = fbm(vec2(p.x * 1.4 + uTime * 0.03, p.y * 3.2 - uTime * 0.01));
    float n2 = fbm(vec2(p.x * 2.8 - uTime * 0.045, p.y * 5.0 + 3.0));
    float low = smoothstep(uHorizon + 0.1, -0.1, vUv.y);
    float density = low * (0.25 + 0.9 * n1) * (0.6 + 0.8 * n2);
    float bd = length((vUv - uBurstPos) * vec2(uAspect, 1.0));
    float burst = uBurst * smoothstep(1.3, 0.0, bd) * (0.45 + 0.9 * n2);
    float a = clamp(density * uAmount + burst, 0.0, 0.85);
    vec3 col = mix(vec3(0.012, 0.02, 0.034), vec3(0.04, 0.055, 0.08), n2) + uAccent * 0.006;
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface StageParams {
  time: number;
  aspect: number;
  /** Screen height (0..1) of the horizon. */
  horizon: number;
  camX: number;
  camY: number;
  scroll: number;
  accent: THREE.Color;
  accentPrev: THREE.Color;
  wipe: number;
  wipeOrigin: THREE.Vector2;
  moon: number;
  mountains: number;
  mist: number;
  mistFg: number;
  burst: number;
  burstPos: THREE.Vector2;
  flash: number;
  glow: number;
  glowPos: THREE.Vector2;
  stars: number;
}

export class Stage {
  /** Draw first (background) and last (foreground mist). */
  readonly background: THREE.Mesh;
  readonly foreground: THREE.Mesh;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly rt: THREE.WebGLRenderTarget;
  private readonly rtScene = new THREE.Scene();
  private readonly rtCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly rtMaterial: THREE.ShaderMaterial;
  private readonly displayMaterial: THREE.ShaderMaterial;
  private readonly mistMaterial: THREE.ShaderMaterial;
  private readonly geometry = new THREE.PlaneGeometry(2, 2);
  private readonly rtMesh: THREE.Mesh;
  private resolutionScale: number;
  private frame = 0;
  private lastParams: StageParams | null = null;
  /** Backdrop refresh interval in frames (the mist is slow, so alternate frames are enough). */
  public refreshEvery = 2;
  public enabled = true;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number, quality: 'HIGH' | 'MEDIUM' | 'LOW') {
    this.renderer = renderer;
    this.resolutionScale = quality === 'HIGH' ? 0.5 : 0.35;
    const octaves = quality === 'HIGH' ? 5 : 3;
    const ridgeOctaves = quality === 'HIGH' ? 4 : 3;
    const defines = { OCTAVES: octaves, RIDGE_OCTAVES: ridgeOctaves };

    this.rt = new THREE.WebGLRenderTarget(Math.round(width * this.resolutionScale), Math.round(height * this.resolutionScale), {
      type: THREE.HalfFloatType,
      depthBuffer: false,
    });
    this.rt.texture.minFilter = THREE.LinearFilter;
    this.rt.texture.magFilter = THREE.LinearFilter;

    this.rtMaterial = new THREE.ShaderMaterial({
      defines,
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: BACKDROP_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: width / height },
        uHorizon: { value: 0.42 },
        uCam: { value: new THREE.Vector2() },
        uScroll: { value: 0 },
        uAccent: { value: new THREE.Color() },
        uAccentPrev: { value: new THREE.Color() },
        uWipe: { value: 0 },
        uWipeOrigin: { value: new THREE.Vector2(0.5, 0.5) },
        uMoon: { value: 1 },
        uMountains: { value: 1 },
        uMist: { value: 1 },
        uFlash: { value: 0 },
        uGlow: { value: 1 },
        uGlowPos: { value: new THREE.Vector2(0.5, 0.4) },
      },
    });
    this.rtMesh = new THREE.Mesh(this.geometry, this.rtMaterial);
    this.rtMesh.frustumCulled = false;
    this.rtScene.add(this.rtMesh);

    this.displayMaterial = new THREE.ShaderMaterial({
      defines,
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: DISPLAY_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tBackdrop: { value: this.rt.texture },
        uTime: { value: 0 },
        uAspect: { value: width / height },
        uHorizon: { value: 0.42 },
        uStars: { value: 1 },
      },
    });
    this.background = new THREE.Mesh(this.geometry, this.displayMaterial);
    this.background.frustumCulled = false;
    this.background.renderOrder = -1000;

    this.mistMaterial = new THREE.ShaderMaterial({
      defines,
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: MIST_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: width / height },
        uHorizon: { value: 0.42 },
        uAmount: { value: 0.6 },
        uBurst: { value: 0 },
        uBurstPos: { value: new THREE.Vector2(0.5, 0.5) },
        uAccent: { value: new THREE.Color() },
      },
    });
    this.foreground = new THREE.Mesh(this.geometry, this.mistMaterial);
    this.foreground.frustumCulled = false;
    this.foreground.renderOrder = 1000;
  }

  resize(width: number, height: number) {
    this.rt.setSize(Math.max(2, Math.round(width * this.resolutionScale)), Math.max(2, Math.round(height * this.resolutionScale)));
    const aspect = width / height;
    this.rtMaterial.uniforms.uAspect.value = aspect;
    this.displayMaterial.uniforms.uAspect.value = aspect;
    this.mistMaterial.uniforms.uAspect.value = aspect;
    this.frame = 0; // redraw immediately
  }

  update(p: StageParams) {
    this.lastParams = p;
    const u = this.rtMaterial.uniforms;
    u.uTime.value = p.time;
    u.uHorizon.value = p.horizon;
    u.uCam.value.set(p.camX, p.camY);
    u.uScroll.value = p.scroll;
    u.uAccent.value.copy(p.accent);
    u.uAccentPrev.value.copy(p.accentPrev);
    u.uWipe.value = p.wipe;
    u.uWipeOrigin.value.copy(p.wipeOrigin);
    u.uMoon.value = p.moon;
    u.uMountains.value = p.mountains;
    u.uMist.value = p.mist;
    u.uFlash.value = p.flash;
    u.uGlow.value = p.glow;
    u.uGlowPos.value.copy(p.glowPos);

    const d = this.displayMaterial.uniforms;
    d.uTime.value = p.time;
    d.uHorizon.value = p.horizon;
    d.uStars.value = p.stars;

    const m = this.mistMaterial.uniforms;
    m.uTime.value = p.time;
    m.uHorizon.value = p.horizon;
    m.uAmount.value = p.mistFg;
    m.uBurst.value = p.burst;
    m.uBurstPos.value.copy(p.burstPos);
    m.uAccent.value.copy(p.accent);
    this.foreground.visible = p.mistFg > 0.01 || p.burst > 0.01;
  }

  /** Renders the half-resolution backdrop (call before the main render each frame). */
  renderBackdrop() {
    if (!this.enabled || !this.lastParams) return;
    this.frame += 1;
    const busy = this.lastParams.wipe > 0.001 && this.lastParams.wipe < 0.999;
    if (!busy && this.frame % this.refreshEvery !== 0 && this.frame > 2) return;
    const previous = this.renderer.getRenderTarget();
    const autoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.rtScene, this.rtCamera);
    this.renderer.setRenderTarget(previous);
    this.renderer.autoClear = autoClear;
  }

  dispose() {
    this.rt.dispose();
    this.geometry.dispose();
    this.rtMaterial.dispose();
    this.displayMaterial.dispose();
    this.mistMaterial.dispose();
  }
}
