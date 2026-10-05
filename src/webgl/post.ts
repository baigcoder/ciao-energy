import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Final look pass, run in display (sRGB) space after tone mapping: a soft vignette, fine
 * animated film grain and ±1 LSB dither (which also removes banding in the dark gradients),
 * and a faint cold lift in the shadows. One pass for all three.
 */
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uGrain: { value: 0.035 },
    uVignette: { value: 0.55 },
    uAberration: { value: 0.0 }, // off: it softened label edges toward the frame corners
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uAberration;
    varying vec2 vUv;
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main() {
      vec2 centre = vUv - 0.5;
      float r2 = dot(centre, centre);
      // lateral chromatic aberration grows toward the corners
      vec2 shift = centre * r2 * uAberration * 18.0;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv - shift).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv + shift).b
      );
      float vig = smoothstep(0.95, 0.15, r2 * 1.9);
      col *= mix(1.0 - uVignette, 1.0, vig);
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      float grain = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
      col += grain * uGrain * (1.0 - luma * 0.6);
      col += (hash(gl_FragCoord.xy * 1.37 + 7.0) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export type PostTier = 'HIGH' | 'MEDIUM';

export class PostFx {
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass | null;
  private readonly finish: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number, height: number, pixelRatio: number, tier: PostTier) {
    const target = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
      type: THREE.HalfFloatType,
      // MSAA on every tier that has post: without it the can's silhouette and lid rings stair-step
      samples: tier === 'HIGH' ? 4 : 2,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(scene, camera));
    // Highlight-only bloom: the threshold sits above the lit label and lacquer, so only
    // specular glints, the rim light and the glow blocks bleed.
    // threshold well above the lit lid and label: only true specular glints bloom, so no halo round the can
    this.bloom = tier === 'HIGH' ? new UnrealBloomPass(new THREE.Vector2(width, height), 0.24, 0.35, 1.7) : null;
    if (this.bloom) this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  setPixelRatio(ratio: number) {
    this.composer.setPixelRatio(ratio);
  }

  render(time: number) {
    this.finish.uniforms.uTime.value = time;
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}
