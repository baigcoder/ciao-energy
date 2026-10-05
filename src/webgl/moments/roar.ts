import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';
import { audioManager } from '../../audio/audioManager';

/**
 * The roar. Once per visit, on the first scroll, the bear from the label rises behind the can: its detail
 * reveals progressively (highlights first, then the darker fur), a cold key light sweeps across it from the upper
 * left, and it takes a breath of the flavor's colour so it belongs to the can in front. The camera gives one short,
 * calm tremor and settles. No particles and no extra post-processing: one textured plane and a small shader.
 *
 * Trigger: first scroll away from the top (App). Persists: nothing (a session flag stops repeats).
 * Scroll/pointer/state: state only (time since trigger). WebGL: a bear plane behind the cans, the
 * stage's flash, camera offset. Optional: skipped entirely under reduced motion. Fallback: the
 * DOM stays as it is; nothing essential lives in the effect.
 */
const SESSION_KEY = 'grizzly_roar_v1';
const DURATION = 3.4;

const BEAR_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uReveal;   // 0..1: the brightness threshold falls, so detail appears highlights-first
  uniform float uSweep;    // 0..1: a soft band of key light travelling left to right
  uniform vec3 uTint;      // the flavor's accent
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(map, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    // keep the bear and the ice, drop the label's black; fade the edges into the night
    vec2 d = (vUv - 0.5) * vec2(1.0, 1.15);
    float edge = smoothstep(0.55, 0.22, length(d));
    // The bear is the warm part of the art (brown fur, tan muzzle); the blue ice behind it stays a quiet backdrop.
    float warm = smoothstep(0.0, 0.14, tex.r - tex.b);
    // progressive reveal: first only the brightest detail (teeth, eyes, fur highlights), then the mid tones
    float threshold = mix(0.6, 0.04, uReveal);
    float body = smoothstep(threshold, threshold + 0.25, lum);
    // the label's own wordmark sits along the bottom of the art: keep it out
    float noWordmark = smoothstep(0.12, 0.3, vUv.y);
    float a = (warm * body + (1.0 - warm) * body * 0.28) * edge * noWordmark * uOpacity;
    // moonlit: cold light on the fur (it keeps some of its own warmth), cold blue-white ice
    vec3 fur = mix(vec3(lum) * vec3(0.85, 0.9, 1.0), tex.rgb, 0.5);
    vec3 ice = vec3(lum) * vec3(0.7, 0.82, 1.0);
    vec3 cold = mix(ice, fur, warm);
    // additive light on the night: the dark brown fur needs lifting to read as a bear, the ice stays quiet
    cold *= mix(1.0, 2.3, warm);
    // directional light: brighter toward the upper left (the key), darker on the lower right
    float facing = dot(normalize(d + 0.0001), normalize(vec2(-0.6, 0.8))) * 0.5 + 0.5;
    cold *= mix(0.55, 1.2, facing);
    // the sweep: a soft band of key light crossing the fur, tinted by the flavor
    float band = exp(-pow((vUv.x - (uSweep * 1.5 - 0.25)) * 3.4, 2.0));
    cold += band * lum * 0.55 * mix(vec3(1.0), uTint, 0.55);
    gl_FragColor = vec4(cold * a, a);
  }
`;

export class RoarMoment implements SceneMoment {
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly loader = new THREE.TextureLoader();
  private readonly textures = new Map<string, THREE.Texture>();
  private armed = false;
  private fired = false;
  private start = -1;
  private aspect = 1.28;

  constructor(private readonly host: SceneManager) {
    this.material = new THREE.ShaderMaterial({
      uniforms: { map: { value: null }, uOpacity: { value: 0 }, uReveal: { value: 0 }, uSweep: { value: 0 }, uTint: { value: new THREE.Color() } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: BEAR_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.mesh.visible = false;
    this.mesh.position.set(0, 0.6, -7);
    this.mesh.renderOrder = -500;
    host.scene.add(this.mesh);
    try {
      this.fired = window.sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      this.fired = false;
    }
  }

  /** Arms the roar; it plays on the next frame. No effect after the first time in a visit. */
  trigger() {
    if (this.fired || this.armed || this.host.reducedMotion) return;
    this.armed = true;
    const slug = FLAVORS[this.host.carousel.getIndex()].id;
    let texture = this.textures.get(slug);
    if (!texture) {
      texture = this.loader.load(`/textures/grizzly/bear/${slug}.webp`, (loaded) => {
        this.aspect = loaded.image.width / loaded.image.height;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(slug, texture);
    }
    this.material.uniforms.map.value = texture;
    this.material.uniforms.uTint.value.set(FLAVORS[this.host.carousel.getIndex()].theme.secondary);
  }

  update(seconds: number, scene: SceneManager) {
    if (!this.armed) return;
    if (this.start < 0) {
      this.start = seconds;
      audioManager.play('growl');
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // the roar may repeat if storage is blocked; harmless
      }
    }
    const t = seconds - this.start;
    if (t > DURATION) {
      this.armed = false;
      this.fired = true;
      this.mesh.visible = false;
      return;
    }
    // Rise, hold, then drift away like breath on cold glass. Dominant but behind the can: the copy stays readable.
    const rise = THREE.MathUtils.smoothstep(t, 0, 0.45);
    const fall = 1 - THREE.MathUtils.smoothstep(t, 2.0, DURATION);
    const opacity = 0.52 * rise * fall;
    this.material.uniforms.uReveal.value = THREE.MathUtils.smoothstep(t, 0.05, 1.5);
    this.material.uniforms.uSweep.value = THREE.MathUtils.smoothstep(t, 0.3, 2.6);
    const distance = scene.camera.position.z + 7;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(scene.camera.fov / 2)) * distance;
    const scale = height * 1.02 * (0.93 + 0.1 * THREE.MathUtils.smoothstep(t, 0, DURATION));
    this.mesh.visible = opacity > 0.002;
    this.mesh.scale.set(scale * this.aspect, scale, 1);
    this.mesh.position.set(scene.camera.position.x, scene.camera.position.y + 0.3, -7);
    this.material.uniforms.uOpacity.value = opacity;

    // The camera shakes: a short, decaying tremor with a tiny push toward the can.
    const decay = Math.exp(-t * 2.4) * (1 - THREE.MathUtils.smoothstep(t, 1.4, 2.0));
    const amp = 0.12 * decay; // one calm tremor, not a shake
    scene.cameraOffset.x += (Math.sin(t * 47) + 0.6 * Math.sin(t * 31 + 1)) * amp;
    scene.cameraOffset.y += (Math.cos(t * 53) + 0.5 * Math.sin(t * 37)) * amp * 0.8;
    scene.cameraOffset.z -= 0.9 * Math.exp(-t * 3.2);
    scene.cameraRollOffset += Math.sin(t * 29) * 0.006 * decay;
    scene.fx.flash = Math.max(scene.fx.flash, 0.22 * Math.exp(-t * 8));
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.textures.forEach((texture) => texture.dispose());
  }
}
