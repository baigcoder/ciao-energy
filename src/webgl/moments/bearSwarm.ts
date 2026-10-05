import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';

/**
 * The finale's signature: in the open sky above the rising row of cans (upper left, where the row leaves the frame
 * empty), the grizzly from the label assembles out of drifting particles
 * (thousands of points gathering from the dark into its silhouette), breathes softly while the row is on screen, and
 * scatters again when the visitor moves on.
 *
 * Trigger: the lineup section (scroll position ≈ 7). Time-driven assembly (≈3 s) once there; the scatter follows the
 * scroll away. WebGL: one Points cloud; positions are blended on the GPU (start → target), so there is no per-frame
 * JS beyond a few uniforms. The bear art is the roar's texture for the flavor in focus, sampled once on a canvas.
 * Optional: fewer points on low-power devices; under reduced motion it appears formed, without drift. Fallback: the
 * finale row alone.
 */
const SECTION = 7;
const SAMPLE_WIDTH = 260;
const ASSEMBLE = 3.0;
/** Upper left of the finale frame (the row rises from lower left to upper right); phones: above the row. */
const DESKTOP_POSITION = new THREE.Vector3(-6.2, 3.7, -7);
const MOBILE_POSITION = new THREE.Vector3(0, 5.2, -7);

const VERTEX = /* glsl */ `
  attribute vec3 target;
  attribute vec4 seed;   // x,y,z: scatter direction, w: 0..1 personal delay
  attribute vec3 colour;
  uniform float uForm;   // 0 scattered .. 1 assembled (with a per-point stagger)
  uniform float uTime;
  uniform float uDrift;
  uniform float uSize;
  varying vec3 vColour;
  varying float vAlpha;
  void main() {
    float k = smoothstep(seed.w * 0.45, seed.w * 0.45 + 0.55, uForm);
    vec3 start = target + seed.xyz * 9.0;
    vec3 p = mix(start, target, k);
    // a living swarm: points never sit still, and loose ones wander further
    float w = uTime * 0.6 + seed.w * 40.0;
    p += vec3(sin(w), cos(w * 1.3), sin(w * 0.7)) * (0.03 + 0.5 * (1.0 - k)) * uDrift;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.8 + 0.6 * fract(seed.w * 13.0)) * (30.0 / max(1.0, -mv.z));
    vColour = colour;
    vAlpha = mix(0.0, 1.0, k) * (0.65 + 0.35 * sin(uTime * 1.7 + seed.w * 60.0));
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColour;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float a = exp(-d * 14.0) * vAlpha * uOpacity;
    gl_FragColor = vec4(vColour * a, a);
  }
`;

export class BearSwarm implements SceneMoment {
  private readonly points: THREE.Points;
  private readonly material: THREE.ShaderMaterial;
  private geometry = new THREE.BufferGeometry();
  private builtFor = -1;
  private loading = -1;
  private amount = 0;
  private form = 0;
  private lastSeconds = -1;
  private readonly maxPoints: number;

  constructor(host: SceneManager) {
    this.maxPoints = host.isLowPower ? 5000 : 12000;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uForm: { value: 0 }, uTime: { value: 0 }, uDrift: { value: 1 }, uSize: { value: 2.2 }, uOpacity: { value: 0 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;
    this.points.renderOrder = -400;
    this.points.position.copy(DESKTOP_POSITION);
    host.scene.add(this.points);
  }

  /** Samples the flavor's bear art into point targets and colours (async: the image loads first). */
  private build(flavorIndex: number) {
    if (this.loading === flavorIndex) return;
    this.loading = flavorIndex;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (this.loading !== flavorIndex) return;
      const width = SAMPLE_WIDTH;
      const height = Math.round((SAMPLE_WIDTH * image.height) / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const candidates: number[] = [];
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const o = (y * width + x) * 4;
          const r = pixels[o] / 255;
          const g = pixels[o + 1] / 255;
          const b = pixels[o + 2] / 255;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const u = x / width - 0.5;
          const v = y / height - 0.5;
          // the bear is the warm, lit part of the art; drop the label's black, the cold ice and the wordmark band
          const inFrame = u * u + v * v * 1.3 < 0.2 && y / height < 0.85;
          // fur (warm), plus the white teeth and eyes inside the head, which give the face its definition
          const fur = r - b > 0.05 && lum > 0.1;
          const whites = lum > 0.78 && Math.abs(r - b) < 0.12 && u > -0.05 && v > -0.3 && v < 0.3;
          if (!inFrame || !(fur || whites)) continue;
          // edges carry the drawing (silhouette, eyes, teeth, fur strokes): keep every high-contrast pixel, thin
          // the flat fur, so the head reads as a drawing rather than a blob
          const right = o + 4 < pixels.length ? (0.299 * pixels[o + 4] + 0.587 * pixels[o + 5] + 0.114 * pixels[o + 6]) / 255 : lum;
          const down = o + width * 4 < pixels.length ? (0.299 * pixels[o + width * 4] + 0.587 * pixels[o + width * 4 + 1] + 0.114 * pixels[o + width * 4 + 2]) / 255 : lum;
          const contrast = Math.abs(lum - right) + Math.abs(lum - down);
          if (Math.random() < 0.6 + contrast * 5) candidates.push(o);
        }
      }
      const count = Math.min(this.maxPoints, candidates.length);
      const step = candidates.length / Math.max(count, 1);
      const targets = new Float32Array(count * 3);
      const seeds = new Float32Array(count * 4);
      const colours = new Float32Array(count * 3);
      const scale = 9 / height; // the bear stands about 9 world units tall
      for (let i = 0; i < count; i += 1) {
        const o = candidates[Math.floor(i * step)];
        const px = (o / 4) % width;
        const py = Math.floor(o / 4 / width);
        targets.set([(px - width / 2 + Math.random() - 0.5) * scale, (height / 2 - py + Math.random() - 0.5) * scale, (Math.random() - 0.5) * 0.6], i * 3);
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        seeds.set([dir.x, dir.y, dir.z * 0.6, Math.random()], i * 4);
        // cold moonlight on the fur, keeping a breath of its own warmth (as in the roar)
        const r = pixels[o] / 255;
        const g = pixels[o + 1] / 255;
        const b = pixels[o + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const lift = 0.5 + 1.7 * lum; // dark fur still reads; highlights (teeth, muzzle) glow
        colours.set([THREE.MathUtils.lerp(0.7, r, 0.8) * lift * 1.3, THREE.MathUtils.lerp(0.78, g, 0.78) * lift * 1.3, THREE.MathUtils.lerp(0.95, b, 0.7) * lift * 1.35], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
      geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
      geometry.setAttribute('colour', new THREE.BufferAttribute(colours, 3));
      this.geometry.dispose();
      this.geometry = geometry;
      this.points.geometry = geometry;
      this.builtFor = flavorIndex;
    };
    image.src = `/textures/grizzly/bear/${FLAVORS[flavorIndex].id}.webp`;
  }

  update(seconds: number, scene: SceneManager) {
    const step = this.lastSeconds < 0 ? 0 : Math.min(0.1, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    const p = scene.sectionPosition;
    const target = THREE.MathUtils.smoothstep(p, SECTION - 0.6, SECTION - 0.15) * (1 - THREE.MathUtils.smoothstep(p, SECTION + 0.15, SECTION + 0.6));
    this.amount += (target - this.amount) * 0.1;
    const flavor = scene.carousel.getIndex();
    if (this.amount > 0.01 && this.builtFor !== flavor) this.build(flavor);
    // the swarm gathers while the row is on screen, and scatters (quicker) as the visitor leaves
    const assembling = target > 0.5 && this.builtFor === flavor;
    this.form = scene.reducedMotion ? (assembling ? 1 : 0) : THREE.MathUtils.clamp(this.form + (assembling ? step / ASSEMBLE : -step / 1.2), 0, 1);
    this.points.visible = this.amount > 0.01 && this.builtFor >= 0;
    if (!this.points.visible) return;
    const u = this.material.uniforms;
    u.uForm.value = this.form;
    u.uTime.value = seconds;
    u.uDrift.value = scene.reducedMotion ? 0 : 1;
    u.uOpacity.value = this.amount * 0.9;
    u.uSize.value = scene.renderer.getPixelRatio() * (window.innerWidth < 768 ? 3.0 : 4.2);
    // phones: the row is smaller and higher, so the bear is too
    const mobile = window.innerWidth < 768;
    this.points.scale.setScalar(mobile ? 0.55 : 1);
    this.points.position.copy(mobile ? MOBILE_POSITION : DESKTOP_POSITION);
  }

  dispose() {
    this.loading = -1;
    this.points.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}
