import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';
import { audioManager } from '../../audio/audioManager';

/**
 * The roar. Once per visit, on the first scroll, the bear from the label appears huge and faint
 * behind the can, the camera shakes slightly, then calm returns.
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
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(map, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    // keep the bear and the ice, drop the label's black; fade the edges into the night
    vec2 d = (vUv - 0.5) * vec2(1.0, 1.15);
    float edge = smoothstep(0.55, 0.22, length(d));
    float a = smoothstep(0.06, 0.4, lum) * edge * uOpacity;
    gl_FragColor = vec4(tex.rgb * a * 1.3, a);
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
      uniforms: { map: { value: null }, uOpacity: { value: 0 } },
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
    // Rise fast, hold, then drift away like breath on cold glass.
    const rise = THREE.MathUtils.smoothstep(t, 0, 0.35);
    const fall = 1 - THREE.MathUtils.smoothstep(t, 1.5, DURATION);
    const opacity = 0.62 * rise * fall;
    const distance = scene.camera.position.z + 7;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(scene.camera.fov / 2)) * distance;
    const scale = height * 1.02 * (0.93 + 0.1 * THREE.MathUtils.smoothstep(t, 0, DURATION));
    this.mesh.visible = opacity > 0.002;
    this.mesh.scale.set(scale * this.aspect, scale, 1);
    this.mesh.position.set(scene.camera.position.x, scene.camera.position.y + 0.3, -7);
    this.material.uniforms.uOpacity.value = opacity;

    // The camera shakes: a short, decaying tremor with a tiny push toward the can.
    const decay = Math.exp(-t * 2.4) * (1 - THREE.MathUtils.smoothstep(t, 1.4, 2.0));
    const amp = 0.2 * decay;
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
