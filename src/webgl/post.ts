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
    // A light product grade: inks a touch richer and blacks a touch deeper, so labels pop instead of reading washed out.
    uSaturation: { value: 1.12 },
    uContrast: { value: 1.06 },
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
    uniform float uSaturation;
    uniform float uContrast;
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
      // grade: saturation around the pixel's own luma, contrast around mid-grey (display space)
      float lumaIn = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lumaIn), col, uSaturation);
      col = (col - 0.5) * uContrast + 0.5;
      col = max(col, 0.0);
      float vig = smoothstep(0.95, 0.15, r2 * 1.9);
      col *= mix(1.0 - uVignette, 1.0, vig);
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      float grain = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
      col += grain * uGrain * (1.0 - luma * 0.6);
      col += (hash(gl_FragCoord.xy * 1.37 + 7.0) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/**
 * Lens focus: a depth-of-field look without a depth buffer. Everything stays sharp inside an ellipse around the
 * featured can (taller than wide, like the can); outside it, a 12-tap golden-angle disc blur opens up with the
 * distance, so the cans behind fall softly out of focus. Fast scrolling adds to the strength (a motion soften).
 * Runs on the linear HDR target, before bloom, so out-of-focus highlights spread into soft discs.
 */
const FocusShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uFocus: { value: new THREE.Vector2(0.5, 0.5) },
    uStrength: { value: 0 },
    uAspect: { value: 1 },
    uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uFocus;
    uniform float uStrength;
    uniform float uAspect;
    uniform vec2 uTexel;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec2 q = vec2((vUv.x - uFocus.x) * uAspect, (vUv.y - uFocus.y) * 0.55);
      float coc = uStrength * smoothstep(0.2, 0.75, length(q)) * 4.5; // circle of confusion, in pixels
      // no early exit: a texture fetch inside non-uniform control flow trips ANGLE's derivative warning
      // (the render target has no mipmaps, so a sharp pixel simply averages the same texel)
      vec3 sum = base.rgb;
      float total = 1.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float r = sqrt((fi + 0.5) / 12.0) * coc;
        float a = fi * 2.39996;
        sum += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * r * uTexel).rgb;
        total += 1.0;
      }
      gl_FragColor = vec4(sum / total, base.a);
    }`,
};

/**
 * Anamorphic streaks: the hottest highlights on the metal (lid rims, the specular line down the can) throw a thin,
 * cool horizontal flare, as through a cinema lens. A one-pass, 32-tap horizontal gather of a soft bright-pass, run on
 * the linear HDR target so only real highlights (well above the lit label) streak.
 */
const AnamorphicShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTexelX: { value: 1 / 1920 },
    uStrength: { value: 0.16 },
    uThreshold: { value: 1.7 }, // only true specular hot spots (rims at 1.15 joined up into lines across the ring)
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTexelX;
    uniform float uStrength;
    uniform float uThreshold;
    varying vec2 vUv;
    vec3 bright(vec2 uv) {
      vec3 c = texture2D(tDiffuse, uv).rgb;
      float l = max(c.r, max(c.g, c.b));
      return c * smoothstep(uThreshold, uThreshold * 2.2, l);
    }
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 streak = vec3(0.0);
      for (int i = 1; i <= 16; i++) {
        float d = float(i) * 2.5;                   // close, even taps: a continuous streak (sparse taps drew dots)
        float w = exp(-float(i) * 0.18);
        streak += (bright(vUv + vec2(d * uTexelX, 0.0)) + bright(vUv - vec2(d * uTexelX, 0.0))) * w;
      }
      // a cool blue cast, as an anamorphic coating gives
      vec3 tint = vec3(0.55, 0.78, 1.0);
      gl_FragColor = vec4(base.rgb + streak * tint * uStrength * 0.12, base.a);
    }`,
};

export type PostTier = 'HIGH' | 'MEDIUM';

export class PostFx {
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass | null;
  private readonly finish: ShaderPass;
  private readonly focus: ShaderPass | null;
  private readonly anamorphic: ShaderPass | null;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number, height: number, pixelRatio: number, tier: PostTier) {
    const target = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
      type: THREE.HalfFloatType,
      samples: tier === 'HIGH' ? 4 : 0,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(scene, camera));
    this.focus = tier === 'HIGH' ? new ShaderPass(FocusShader) : null;
    if (this.focus) {
      this.focus.enabled = false;
      this.composer.addPass(this.focus);
      this.setFocusSize(width, height);
    }
    // Highlight-only bloom: the threshold sits above the lit label and lacquer, so only
    // specular glints, the rim light and the glow blocks bleed.
    // threshold well above the lit lid and label: only true specular glints bloom, so no halo round the can
    this.bloom = tier === 'HIGH' ? new UnrealBloomPass(new THREE.Vector2(width, height), 0.24, 0.35, 1.7) : null;
    this.anamorphic = tier === 'HIGH' ? new ShaderPass(AnamorphicShader) : null;
    if (this.anamorphic) {
      this.composer.addPass(this.anamorphic);
      this.anamorphic.uniforms.uTexelX.value = 1 / Math.max(width, 1);
    }
    if (this.bloom) this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.setFocusSize(width, height);
  }

  private setFocusSize(width: number, height: number) {
    if (this.anamorphic) this.anamorphic.uniforms.uTexelX.value = 1 / Math.max(width, 1);
    if (!this.focus) return;
    this.focus.uniforms.uAspect.value = width / Math.max(height, 1);
    this.focus.uniforms.uTexel.value.set(1 / Math.max(width, 1), 1 / Math.max(height, 1));
  }

  /** Lens focus on a screen point (uv); strength 0 turns the pass off. */
  setFocus(x: number, y: number, strength: number) {
    if (!this.focus) return;
    this.focus.enabled = strength > 0.02;
    this.focus.uniforms.uFocus.value.set(x, y);
    this.focus.uniforms.uStrength.value = strength;
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
