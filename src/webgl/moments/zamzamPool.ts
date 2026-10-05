import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { audioManager } from '../../audio/audioManager';

/**
 * Zamzam and halal. The pace slows. The night gives way to clear water seen from above, softly lit;
 * a single drop falls and a ripple spreads from the centre, where the halal seal is drawn line by
 * line (DOM). Respectful and quiet: no sparkle, no bounce, one drop every few seconds.
 *
 * Trigger: scroll position at the Zamzam chapter (the last benefit). Scroll-driven in/out, then
 * time-driven (the drop). WebGL: one full-screen water quad behind the cans; the can steps out of
 * the way (scaled to nothing) and returns afterwards. DOM: the seal and the chapter copy. Optional:
 * with reduced motion the pool is still, with a few frozen rings.
 */
const CHAPTER = 5; // section position of the Zamzam chapter (benefits-4)
const IMPACT = 1.6; // seconds from release to the drop hitting the water
const CYCLE = 9;

import { SEAL_POSITION } from './zamzamLayout';

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uAlpha;
  uniform float uTime;
  uniform float uDrop;
  uniform float uAspect;
  uniform vec2 uCenter;
  uniform vec3 uAccent;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.02 + 7.3; a *= 0.5; } return v; }
  void main() {
    vec2 uv = vUv;
    vec2 q = (uv - uCenter) * vec2(uAspect, 1.0);
    float r = length(q);

    // clear water: deep at the edges, lifted toward the light in the upper left
    float light = exp(-length((uv - vec2(0.2, 1.05)) * vec2(uAspect, 1.0)) * 1.3);
    vec3 col = mix(vec3(0.004, 0.022, 0.032), vec3(0.03, 0.11, 0.15), light);
    col += uAccent * 0.012;

    // ripple height field: three rings spreading and fading after the impact
    float t = uDrop - ${IMPACT.toFixed(2)};
    float height = 0.0;
    if (t > 0.0) {
      for (int i = 0; i < 3; i++) {
        float ti = t - float(i) * 0.45;
        if (ti > 0.0) {
          float radius = ti * 0.16;
          float w = (r - radius) * 30.0;
          height += sin(w * 2.2) * exp(-w * w * 0.12) * exp(-ti * 0.55) / (1.0 + float(i));
        }
      }
    }
    // refraction of the caustic lines through the ripple, and a soft ring highlight
    vec2 warp = vec2(0.0);
    if (r > 0.0001) warp = normalize(q) * height * 0.012;
    vec2 cp = (uv * vec2(uAspect, 1.0) + warp) * 3.2;
    float c = fbm(cp + vec2(uTime * 0.03, -uTime * 0.02));
    float caustic = pow(1.0 - abs(sin(c * 13.0)), 12.0);
    float fine = pow(1.0 - abs(sin(fbm(cp * 2.1 - uTime * 0.02) * 17.0)), 12.0);
    col += vec3(0.25, 0.55, 0.65) * (caustic * 0.028 + fine * 0.03) * (0.35 + light);
    col += vec3(0.5, 0.8, 0.9) * max(height, 0.0) * 0.07;
    col -= vec3(0.02, 0.05, 0.06) * max(-height, 0.0) * 0.5;

    // the drop: a small teardrop of light falling from the top to the centre
    if (uDrop < ${IMPACT.toFixed(2)} && uDrop > 0.0) {
      float k = uDrop / ${IMPACT.toFixed(2)};
      float y = mix(1.15, uCenter.y, k * k);
      vec2 dq = (uv - vec2(uCenter.x, y)) * vec2(uAspect, 1.0);
      float stretch = mix(2.2, 1.0, k);
      float d = length(vec2(dq.x * 1.6, dq.y / stretch));
      col += vec3(0.7, 0.9, 1.0) * (smoothstep(0.016, 0.0, d) * 0.9 + smoothstep(0.07, 0.0, d) * 0.14);
    }
    gl_FragColor = vec4(col, uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class ZamzamPool implements SceneMoment {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
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
        uCenter: { value: new THREE.Vector2(0.68, 0.5) },
        uAccent: { value: new THREE.Color() },
      },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: false,
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
    u.uTime.value = seconds;
    u.uDrop.value = scene.reducedMotion ? IMPACT + 3.2 : seconds - this.dropStart;
    u.uAspect.value = scene.camera.aspect;
    const pos = window.innerWidth < 768 ? SEAL_POSITION.mobile : SEAL_POSITION.desktop;
    u.uCenter.value.set(pos.x, 1 - pos.y);
    u.uAccent.value.copy(scene.stageParams.accent);

    // the can steps out of the way and returns afterwards; the night behind it rests
    const d = scene.data;
    d.canScale *= 1 - a;
    d.labelDim *= 1 - a;
    d.mountains *= 1 - a;
    d.moon *= 1 - a;
    d.stars *= 1 - a;
    d.mistFg *= 1 - 0.8 * a;
    d.reflect *= 1 - a;
    d.glow *= 1 - a;
    if (a > 0.97) scene.canOverride.index = -1;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
