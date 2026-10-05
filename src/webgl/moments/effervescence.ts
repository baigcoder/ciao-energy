import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';
import { CAN } from '../canDimensions';
import { RECIPES, buildFruitMesh, type Kind } from './fruitField';

/**
 * Effervescence. On the electrolytes chapter the featured can stays whole and lit, and the air around it turns into
 * the drink: fine carbonation streams up past the can, a few larger bubbles drift through, and the flavor's fruit
 * floats slowly beside and behind it. (It replaces a camera dive through a dissolving label into the can, which read
 * as a broken can mid-transition.)
 *
 * Trigger: scroll position around the electrolytes chapter. Scroll-driven (a smooth bump over the section), then
 * time-driven (the bubbles rise on the GPU, the fruit drifts). WebGL only: one Points cloud and instanced fruit in a
 * world-aligned group that follows the can (so bubbles always rise straight up). Optional: reduced motion freezes the
 * bubbles and the fruit. Fallback: the chapter's DOM copy and the lit label block carry the benefit.
 */
const CHAPTER = 3; // section position of the electrolytes chapter (benefits-2)
const BUBBLES = 520;
const VOLUME_HEIGHT = CAN.shellHeight * 1.7;

const BUBBLE_VERTEX = /* glsl */ `
  attribute vec4 seed;
  uniform float uTime;
  uniform float uScale;
  varying float vFade;
  void main() {
    float height = ${VOLUME_HEIGHT.toFixed(2)};
    float y = mod(seed.y * height + uTime * (0.35 + seed.w * 0.7), height) - height * 0.5;
    float sway = sin(uTime * (0.6 + seed.w) + seed.z * 6.28);
    vec3 p = vec3(position.x + sway * 0.06, y, position.z + cos(uTime * 0.5 + seed.x * 6.28) * 0.06);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // mostly fine fizz, a few larger bubbles (seed.w cubed skews the sizes small)
    gl_PointSize = (2.0 + seed.w * seed.w * seed.w * 16.0) * uScale * 18.0 / max(1.0, -mv.z);
    float edge = height * 0.5;
    vFade = smoothstep(-edge, -edge * 0.7, y) * (1.0 - smoothstep(edge * 0.6, edge, y));
  }
`;

const BUBBLE_FRAGMENT = /* glsl */ `
  varying float vFade;
  uniform vec3 uAccent;
  uniform float uAmount;
  void main() {
    // a glassy sphere: bright fresnel rim, nearly clear centre, a hot key highlight up-left
    vec2 c = (gl_PointCoord - 0.5) * 2.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float n = sqrt(1.0 - r2);
    float rim = pow(1.0 - n, 2.2);
    float edge = smoothstep(1.0, 0.86, sqrt(r2));
    float key = pow(max(0.0, dot(normalize(vec3(c, n)), normalize(vec3(-0.45, 0.55, 0.7)))), 40.0);
    vec3 tint = mix(vec3(0.88, 0.96, 1.0), uAccent, 0.2);
    float a = (rim * 0.8 * edge + key * 1.3 + 0.05) * vFade * uAmount;
    gl_FragColor = vec4(tint * a, a);
  }
`;

export class Effervescence implements SceneMoment {
  private readonly group = new THREE.Group();
  private readonly bubbleMaterial: THREE.ShaderMaterial;
  private readonly bubbleGeometry: THREE.BufferGeometry;
  private readonly fruit: Array<{ mesh: THREE.InstancedMesh; seeds: Float32Array; dispose: () => void }> = [];
  private readonly dummy = new THREE.Object3D();
  private builtFor = -1;
  private amount = 0;
  private clock = 0;
  private lastSeconds = -1;

  constructor(host: SceneManager) {
    // Bubbles fill a ring around the can (never inside it), rising on the GPU.
    const positions = new Float32Array(BUBBLES * 3);
    const seeds = new Float32Array(BUBBLES * 4);
    for (let i = 0; i < BUBBLES; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = CAN.radius * (1.12 + 2.4 * Math.sqrt(Math.random()));
      positions.set([Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.8], i * 3);
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    this.bubbleGeometry = new THREE.BufferGeometry();
    this.bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bubbleGeometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    this.bubbleMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uAccent: { value: new THREE.Color() }, uAmount: { value: 0 } },
      vertexShader: BUBBLE_VERTEX,
      fragmentShader: BUBBLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bubbles = new THREE.Points(this.bubbleGeometry, this.bubbleMaterial);
    bubbles.frustumCulled = false;
    this.group.add(bubbles);
    this.group.visible = false;
    host.scene.add(this.group);
  }

  /** Floating fruit for the flavor now in focus (rebuilt when the flavor changes). */
  private buildFruit(flavorIndex: number) {
    this.clearFruit();
    const recipe = RECIPES[FLAVORS[flavorIndex].id] ?? [];
    recipe.forEach((item) => {
      const count = Math.min(4, item.count);
      const { mesh, dispose } = buildFruitMesh(item.kind as Kind, count);
      const seeds = new Float32Array(count * 6);
      const colour = new THREE.Color(item.color);
      for (let i = 0; i < count; i += 1) {
        // beside and behind the can, never in front of the lit label block
        const angle = -0.25 * Math.PI + Math.random() * 1.5 * Math.PI;
        const radius = CAN.radius * (1.6 + 1.3 * Math.random());
        const y = (Math.random() - 0.5) * CAN.shellHeight * 1.2;
        seeds.set([Math.cos(angle) * radius, y, -Math.abs(Math.sin(angle)) * radius * 0.9, Math.random() * 6.28, 0.5 + Math.random() * 0.8, item.size], i * 6);
        mesh.setColorAt(i, colour);
      }
      mesh.count = count;
      this.group.add(mesh);
      this.fruit.push({ mesh, seeds, dispose });
    });
    this.builtFor = flavorIndex;
  }

  private clearFruit() {
    this.fruit.forEach(({ mesh, dispose }) => {
      this.group.remove(mesh);
      dispose();
    });
    this.fruit.length = 0;
  }

  update(seconds: number, scene: SceneManager) {
    const p = scene.sectionPosition;
    const target = THREE.MathUtils.smoothstep(p, CHAPTER - 0.6, CHAPTER - 0.1) * (1 - THREE.MathUtils.smoothstep(p, CHAPTER + 0.1, CHAPTER + 0.6));
    this.amount += (target - this.amount) * 0.12;
    const step = this.lastSeconds < 0 ? 0 : Math.min(0.05, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    if (!scene.reducedMotion) this.clock += step;
    if (this.amount < 0.003) {
      this.group.visible = false;
      return;
    }

    const index = scene.carousel.getIndex();
    const can = scene.cans[scene.featuredCanIndex()];
    if (this.builtFor !== index) this.buildFruit(index);
    this.group.visible = true;
    this.group.position.setFromMatrixPosition(can.matrixWorld);
    this.group.scale.setScalar(can.scale.x);

    const a = this.amount;
    const u = this.bubbleMaterial.uniforms;
    u.uTime.value = this.clock;
    u.uScale.value = can.scale.x;
    u.uAmount.value = a;
    u.uAccent.value.set(FLAVORS[index].theme.secondary);

    // fruit drifts in slow, lazy circles and grows in with the chapter
    this.fruit.forEach(({ mesh, seeds }) => {
      for (let i = 0; i < mesh.count; i += 1) {
        const o = i * 6;
        const phase = seeds[o + 3] + this.clock * 0.3 * seeds[o + 4];
        this.dummy.position.set(seeds[o] + Math.sin(phase) * 0.15, seeds[o + 1] + Math.sin(phase * 0.7) * 0.25, seeds[o + 2] + Math.cos(phase) * 0.12);
        this.dummy.rotation.set(phase * 0.6, phase * 0.4, phase * 0.3);
        this.dummy.scale.setScalar(seeds[o + 5] * 0.6 * (0.8 + 0.4 * seeds[o + 4]) * a);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  dispose() {
    this.group.removeFromParent();
    this.clearFruit();
    this.bubbleGeometry.dispose();
    this.bubbleMaterial.dispose();
  }
}
