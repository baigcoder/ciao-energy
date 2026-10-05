import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { audioManager } from '../../audio/audioManager';
import { CAN } from '../canDimensions';

/**
 * Zamzam: the source. The pace slows. The night gives way to a deep, still pool lit from above; the whole can stands
 * on the water line with its reflection beneath it, slow shafts of light fall onto it, motes drift up through the
 * light, and calm rings spread from its base. Every few seconds a single drop falls beside the can and its rings cross
 * the others. Respectful and quiet: no sparkle bursts, no bounce.
 *
 * Trigger: scroll position at the Zamzam chapter (the last benefit). Scroll-driven in/out, then time-driven (the drop
 * and the rings). WebGL: one full-screen quad behind the cans, centred on the can's base each frame; the can and its
 * floor reflection are the regular scene. DOM: the chapter copy and the halal seal badge. Optional: with reduced
 * motion the water is still, with a few frozen rings.
 */
const CHAPTER = 5; // section position of the Zamzam chapter (benefits-4)
const IMPACT = 1.6; // seconds from release to the drop hitting the water
const CYCLE = 8;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uAlpha;
  uniform float uTime;
  uniform float uDrop;
  uniform float uAspect;
  uniform vec2 uBase;     // the can's base on screen (uv): the water line runs through it
  uniform vec3 uAccent;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  // Rings on the water seen at a low angle: circles flattened into ellipses. Returns the surface height.
  float rings(vec2 uv, vec2 c, float age, float speed, float count) {
    vec2 q = (uv - c) * vec2(uAspect, 1.0 / 0.22);
    float r = length(q);
    float h = 0.0;
    for (int i = 0; i < 3; i++) {
      if (float(i) >= count) break;
      float ti = age - float(i) * 0.5;
      if (ti > 0.0) {
        float w = (r - ti * speed) * 26.0;
        h += sin(w * 2.0) * exp(-w * w * 0.08) * exp(-ti * 0.45) / (1.0 + float(i) * 0.6);
      }
    }
    return h;
  }

  void main() {
    vec2 uv = vUv;
    float x = (uv.x - uBase.x) * uAspect;
    // the far edge of the pool sits a little above the can's base (a camera just above the water)
    float shore = uBase.y + 0.13;

    // the air above the pool: deep teal, nearly black at the top, lit from above onto the can
    float up = clamp((uv.y - shore) / (1.0 - shore + 0.001), 0.0, 1.0);
    vec3 teal = vec3(0.018, 0.075, 0.09) + uAccent * 0.012;
    vec3 col = mix(teal, vec3(0.003, 0.011, 0.016), pow(up, 0.6));
    float spread = 0.1 + 0.5 * (1.0 - uv.y);
    float cone = exp(-(x / spread) * (x / spread));
    float s = x / spread;
    float shafts = 0.5 + 0.5 * sin(s * 7.0 + uTime * 0.22) * sin(s * 3.1 - uTime * 0.15);
    col += vec3(0.32, 0.62, 0.68) * cone * (0.05 + 0.09 * shafts) * smoothstep(shore - 0.1, shore + 0.25, uv.y);
    vec2 hq = vec2(x, uv.y - uBase.y - 0.32) * vec2(1.0, 1.3);
    col += vec3(0.25, 0.55, 0.6) * exp(-dot(hq, hq) * 5.0) * 0.12; // a soft halo behind the can

    // the pool
    float water = smoothstep(shore + 0.012, shore - 0.012, uv.y);
    if (water > 0.0) {
      float depth = clamp((shore - uv.y) / max(shore, 0.05), 0.0, 1.0);
      vec3 pool = mix(vec3(0.02, 0.08, 0.095), vec3(0.002, 0.012, 0.018), pow(depth, 0.7));
      // the overhead light mirrored on the water: a broken vertical streak under the can
      float swell = vnoise(vec2(uv.x * uAspect * 6.0 + uTime * 0.05, depth * 70.0 - uTime * 0.6));
      float streak = exp(-abs(x + (swell - 0.5) * 0.04) / (0.03 + 0.12 * depth));
      pool += vec3(0.3, 0.6, 0.66) * streak * (0.04 + 0.1 * smoothstep(0.45, 0.85, swell)) * (1.0 - depth * 0.6);
      // calm rings from the can's base, one set every few seconds, and the drop's rings beside it
      float calm = rings(uv, uBase, mod(uTime, 4.0), 0.09, 2.0) * 0.5 + rings(uv, uBase, mod(uTime + 2.0, 4.0), 0.09, 1.0) * 0.35;
      vec2 dropAt = vec2(uBase.x - 0.2 / uAspect, uBase.y - 0.035);
      float drop = rings(uv, dropAt, uDrop - ${IMPACT.toFixed(2)}, 0.12, 3.0);
      float h = calm + drop;
      pool += vec3(0.55, 0.85, 0.92) * max(h, 0.0) * 0.16;
      pool -= vec3(0.01, 0.03, 0.035) * max(-h, 0.0) * 0.4;
      // the shore line catches a thin, cold highlight
      pool += vec3(0.2, 0.42, 0.48) * exp(-abs(uv.y - shore) * 220.0) * 0.25;
      col = mix(col, pool, water);
    }

    // motes rising slowly through the light
    vec2 g = vec2(uv.x * uAspect, uv.y - uTime * 0.012) * 34.0;
    vec2 cell = floor(g);
    float m = hash(cell);
    vec2 local = fract(g) - 0.5 - (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.6;
    float mote = step(0.965, m) * smoothstep(0.12, 0.0, length(local)) * (0.4 + 0.6 * sin(uTime * (0.5 + m * 2.0) + m * 30.0));
    col += vec3(0.6, 0.85, 0.95) * max(mote, 0.0) * 0.22 * (0.3 + cone) * (1.0 - water);

    // the drop: a small teardrop of light falling from the top to the water beside the can
    if (uDrop < ${IMPACT.toFixed(2)} && uDrop > 0.0) {
      float k = uDrop / ${IMPACT.toFixed(2)};
      vec2 dropAt = vec2(uBase.x - 0.2 / uAspect, uBase.y - 0.035);
      float y = mix(1.1, dropAt.y, k * k);
      vec2 dq = (uv - vec2(dropAt.x, y)) * vec2(uAspect, 1.0);
      float stretch = mix(2.2, 1.0, k);
      float d = length(vec2(dq.x * 1.6, dq.y / stretch));
      col += vec3(0.7, 0.92, 1.0) * (smoothstep(0.012, 0.0, d) * 0.9 + smoothstep(0.06, 0.0, d) * 0.12);
    }

    // a soft vignette keeps the eye on the can and the copy
    vec2 vq = (uv - 0.5) * vec2(1.0, 1.2);
    col *= 1.0 - 0.4 * smoothstep(0.35, 0.9, length(vq));
    gl_FragColor = vec4(col, uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class ZamzamPool implements SceneMoment {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly base = new THREE.Vector3();
  private amount = 0;
  private dropStart = -1;
  private dropSounded = false;

  constructor(host: SceneManager) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAlpha: { value: 0 },
        uTime: { value: 0 },
        uDrop: { value: 0 },
        uAspect: { value: 1 },
        uBase: { value: new THREE.Vector2(0.68, 0.2) },
        uAccent: { value: new THREE.Color() },
      },
      // Drawn at the far plane with the depth test on: as a transparent material it renders after the opaque can, so
      // only depth (not renderOrder) keeps it behind the can and its reflection.
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -900;
    this.mesh.visible = false;
    host.scene.add(this.mesh);
  }

  update(seconds: number, scene: SceneManager) {
    const p = scene.sectionPosition;
    const target = THREE.MathUtils.smoothstep(p, CHAPTER - 0.6, CHAPTER - 0.15) * (1 - THREE.MathUtils.smoothstep(p, CHAPTER + 0.15, CHAPTER + 0.6));
    // the pace slows: the pool follows the scroll lazily
    this.amount += (target - this.amount) * 0.08;
    const a = this.amount;
    this.mesh.visible = a > 0.003;
    if (!this.mesh.visible) {
      this.dropStart = -1;
      return;
    }
    const u = this.material.uniforms;
    if (this.dropStart < 0 || seconds - this.dropStart > CYCLE) {
      this.dropStart = seconds;
      this.dropSounded = false;
    }
    if (!this.dropSounded && seconds - this.dropStart > IMPACT && !scene.reducedMotion) {
      this.dropSounded = true;
      audioManager.play('drop');
    }
    u.uAlpha.value = a;
    u.uTime.value = scene.reducedMotion ? 1.3 : seconds;
    u.uDrop.value = scene.reducedMotion ? IMPACT + 3.2 : seconds - this.dropStart;
    u.uAspect.value = scene.camera.aspect;
    u.uAccent.value.copy(scene.stageParams.accent);

    // The water line runs through the featured can's base (last frame's pose: one frame of lag is invisible here).
    const can = scene.cans[scene.featuredCanIndex()];
    if (can?.visible && can.position.y > -100) {
      this.base.set(0, -(CAN.shellHeight / 2 + CAN.bottomHeight), 0).applyMatrix4(can.matrixWorld).project(scene.camera);
      u.uBase.value.set(this.base.x * 0.5 + 0.5, THREE.MathUtils.clamp(this.base.y * 0.5 + 0.5, 0.05, 0.6));
    }

    // the night behind the pool rests
    const d = scene.data;
    d.mountains *= 1 - a;
    d.moon *= 1 - a;
    d.stars *= 1 - a;
    d.mistFg *= 1 - 0.9 * a;
    d.glow *= 1 - a;
    if (a > 0.97) scene.canOverride.index = -1;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
