import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';

/**
 * Ice dust: fine crystals hanging in the cold air between the camera and the mountains, so the
 * night has depth. One point cloud; every particle's drift, twinkle and wrap is computed in the
 * vertex shader from its seed and the clock, so nothing is allocated or uploaded per frame.
 *
 * Real-time inputs: time (slow fall and sway), pointer (a breath of wind), scroll speed (the dust
 * streaks past the camera as the visitor scrolls, then settles) and the flavor accent (crystals
 * near the focused can catch its colour). Persistent: nothing. Optional: fewer particles on the
 * medium tier, none on the low tier or for reduced motion. Fallback: the stage's CSS/backdrop mist.
 */
const VERTEX = /* glsl */ `
  attribute vec4 seed;            // xyz: position in the unit box, w: random
  uniform float uTime;
  uniform vec3 uBox;              // half extents of the field around the camera
  uniform vec3 uCamera;
  uniform vec2 uWind;             // pointer wind (world units)
  uniform float uScroll;          // signed scroll speed
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vAlpha;
  varying float vTwinkle;
  varying float vNearCan;
  uniform vec3 uCanPos;
  void main() {
    float r = seed.w;
    vec3 p = (seed.xyz * 2.0 - 1.0) * uBox;
    // slow fall and sway, plus a scroll-driven streak (the field moves past the camera)
    p.y -= uTime * (0.08 + 0.12 * r) + uScroll * 1.6;
    p.x += sin(uTime * (0.15 + 0.2 * r) + r * 40.0) * 0.35 + uWind.x * (0.4 + r);
    p.z += cos(uTime * (0.1 + 0.15 * r) + r * 17.0) * 0.25;
    p.y += uWind.y * (0.3 + r) * 0.5;
    // wrap inside the box that travels with the camera: an endless field, no respawn on the CPU
    vec3 rel = p - uCamera * vec3(1.0, 1.0, 0.0);
    rel = mod(rel + uBox, uBox * 2.0) - uBox;
    vec3 world = vec3(uCamera.x, uCamera.y, 0.0) + rel;
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float depth = -mv.z;
    gl_Position = projectionMatrix * mv;
    // perspective size; scroll speed stretches nothing (points are round) but brightens the streak
    gl_PointSize = uSize * (0.6 + 0.8 * r) * uPixelRatio * (30.0 / max(depth, 1.0));
    // fade the nearest (out of focus, too big) and the farthest crystals
    vAlpha = smoothstep(3.0, 9.0, depth) * (1.0 - smoothstep(34.0, 52.0, depth));
    vAlpha *= 0.55 + 0.45 * min(1.0, abs(uScroll) * 0.6);
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + 3.0 * r) + r * 60.0);
    // invisible crystals (too near / too far) skip rasterisation entirely
    if (vAlpha <= 0.0) gl_PointSize = 0.0;
    vNearCan = exp(-length(world.xy - uCanPos.xy) * 0.35);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uIce;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTwinkle;
  varying float vNearCan;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // a soft core with a faint four-point glint, like light catching an ice crystal
    float core = smoothstep(0.5, 0.0, d);
    float glint = max(0.0, 1.0 - abs(c.x) * 14.0) * max(0.0, 1.0 - abs(c.y) * 3.0)
                + max(0.0, 1.0 - abs(c.y) * 14.0) * max(0.0, 1.0 - abs(c.x) * 3.0);
    float a = (core * core + glint * 0.25 * vTwinkle) * vAlpha * vTwinkle * uOpacity;
    if (a < 0.004) discard;
    vec3 col = mix(uIce, uAccent, vNearCan * 0.55);
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

const COUNTS = { HIGH: 1400, MEDIUM: 600, LOW: 0 } as const;

export class IceDust implements SceneMoment {
  private readonly points: THREE.Points | null = null;
  private readonly material: THREE.ShaderMaterial | null = null;
  private readonly geometry: THREE.BufferGeometry | null = null;
  private readonly wind = new THREE.Vector2();

  constructor(host: SceneManager) {
    const count = host.reducedMotion ? 0 : COUNTS[host.quality];
    if (!count) return;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i += 1) seeds[i] = Math.random();
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    // positions are computed in the shader; a dummy attribute keeps three's draw count right
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); // never frustum-culled
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uBox: { value: new THREE.Vector3(16, 10, 18) },
        uCamera: { value: new THREE.Vector3() },
        uWind: { value: new THREE.Vector2() },
        uScroll: { value: 0 },
        uPixelRatio: { value: host.renderer.getPixelRatio() },
        uSize: { value: 2.4 },
        uIce: { value: new THREE.Color(0xd8e8ff) },
        uAccent: { value: new THREE.Color() },
        uOpacity: { value: 0.9 },
        uCanPos: { value: new THREE.Vector3() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    host.scene.add(this.points);
  }

  update(seconds: number, scene: SceneManager) {
    if (!this.points || !this.material) return;
    // tier and reduced motion can change after start-up (the app and the frame-rate governor set them)
    this.points.visible = !scene.reducedMotion && scene.quality !== 'LOW';
    if (!this.points.visible) return;
    const u = this.material.uniforms;
    u.uTime.value = seconds;
    u.uCamera.value.copy(scene.camera.position);
    u.uScroll.value = scene.scrollVelocity;
    u.uPixelRatio.value = scene.renderer.getPixelRatio();
    u.uAccent.value.copy(scene.stageParams.accent);
    u.uCanPos.value.set(scene.data.canPosX, scene.data.canPosY, scene.data.canPosZ);
    // pointer as a breath of wind, eased so the dust drifts rather than snaps
    const w = scene.pointerWind();
    this.wind.lerp(w, 0.04);
    u.uWind.value.copy(this.wind);
    // quieter in the close-up label chapters and inside the can, where it would sit on the text
    const calm = Math.max(scene.data.labelDim, scene.stageParams.water);
    // and nearly gone in the grey product studio, which reads clean like the reference
    u.uOpacity.value = 0.9 * (1 - 0.75 * calm) * (1 - 0.8 * scene.data.studio);
  }

  dispose() {
    this.points?.removeFromParent();
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
