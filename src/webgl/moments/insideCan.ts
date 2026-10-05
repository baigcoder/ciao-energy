import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';
import { getCanSurface } from '../canModel';
import { CAN } from '../canGeometry';
import { RECIPES, buildFruitMesh, type Kind } from './fruitField';

/**
 * Inside the can. On the electrolytes chapter the camera pushes through the label (which
 * dissolves, edged in the flavor colour) into the liquid: bubbles rise, fruit floats, light falls
 * from above. As the visitor scrolls on, it pulls back out.
 *
 * Trigger: scroll position around the electrolytes chapter. Scroll-driven (a smooth bump over
 * the section). WebGL: camera move + fov, the label dissolve uniform, an interior wall, bubbles,
 * a god-ray cone and instanced fruit (all parented to the featured can); the stage adds the
 * underwater tint. Optional: reduced motion keeps the can still and skips the move. Fallback: the
 * chapter's DOM copy and the lit label block carry the benefit.
 */
const CHAPTER = 3; // section position of the electrolytes chapter (benefits-2)
const BUBBLES = 420; // carbonation: many small bubbles read as fizz, a few big ones read as a lava lamp

const WALL_FRAGMENT = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    float h = vPos.y / ${(CAN.shellHeight / 2).toFixed(2)};
    float top = smoothstep(-0.8, 1.0, h);
    float ripple = 0.5 + 0.5 * sin(vPos.x * 9.0 + vPos.z * 7.0 + uTime * 0.6 + vPos.y * 4.0);
    // the drink itself: deep flavor colour below, lit flavor colour under the opening (no fixed blue mixed in)
    vec3 col = mix(uAccent * 0.025 + vec3(0.002, 0.004, 0.006), uAccent * 0.32 + vec3(0.02, 0.03, 0.035), top);
    col += mix(vec3(0.6, 0.7, 0.75), uAccent, 0.5) * ripple * ripple * top * 0.1;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const BUBBLE_VERTEX = /* glsl */ `
  attribute vec4 seed;
  uniform float uTime;
  uniform float uScale;
  varying float vFade;
  void main() {
    float height = ${CAN.shellHeight.toFixed(2)};
    float y = mod(seed.y * height + uTime * (0.25 + seed.w * 0.5), height) - height * 0.5;
    float sway = sin(uTime * (0.6 + seed.w) + seed.z * 6.28);
    vec3 p = vec3(position.x + sway * 0.05, y, position.z + cos(uTime * 0.5 + seed.x * 6.28) * 0.05);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // mostly fine bubbles, a few larger ones (seed.w cubed skews the sizes small)
    gl_PointSize = (3.0 + seed.w * seed.w * seed.w * 14.0) * uScale / max(0.5, -mv.z) * 6.0;
    vFade = smoothstep(-1.9, -1.2, y) * (1.0 - smoothstep(1.3, 1.9, y)) * clamp(1.6 / max(0.6, -mv.z), 0.35, 1.0);
  }
`;

const BUBBLE_FRAGMENT = /* glsl */ `
  varying float vFade;
  uniform vec3 uAccent;
  void main() {
    // a glassy sphere: bright fresnel rim, nearly clear centre, a hot key highlight up-left and a
    // faint caustic opposite (light focused through the bubble)
    vec2 c = (gl_PointCoord - 0.5) * 2.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float n = sqrt(1.0 - r2);
    float rim = pow(1.0 - n, 2.2);
    float edge = smoothstep(1.0, 0.86, sqrt(r2));
    float key = pow(max(0.0, dot(normalize(vec3(c, n)), normalize(vec3(-0.45, 0.55, 0.7)))), 40.0);
    float caustic = smoothstep(0.35, 0.0, length(c - vec2(0.32, -0.38))) * 0.25;
    vec3 tint = mix(vec3(0.85, 0.95, 1.0), uAccent, 0.25);
    float a = (rim * 0.75 * edge + key * 1.2 + caustic + 0.04) * vFade;
    gl_FragColor = vec4(tint * a, a);
  }
`;

const RAY_FRAGMENT = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    float along = vUv.y;                                  // 1 at the top (the light), 0 at the tip
    float angle = atan(vPos.x, vPos.z);
    float streak = 0.5 + 0.5 * sin(angle * 7.0 + uTime * 0.2) * sin(angle * 3.0 - uTime * 0.13);
    float a = pow(along, 1.6) * (0.25 + 0.75 * streak) * 0.5;
    gl_FragColor = vec4(mix(vec3(0.55, 0.75, 0.9), uAccent, 0.35) * a, a);
  }
`;

export class InsideCan implements SceneMoment {
  private readonly group = new THREE.Group();
  private readonly wallMaterial: THREE.ShaderMaterial;
  private readonly bubbleMaterial: THREE.ShaderMaterial;
  private readonly rayMaterial: THREE.ShaderMaterial;
  private readonly disposers: Array<() => void> = [];
  private readonly fruit: Array<{ mesh: THREE.InstancedMesh; seeds: Float32Array }> = [];
  private readonly dummy = new THREE.Object3D();
  private readonly target = new THREE.Vector3();
  private builtFor = -1;
  private amount = 0;

  constructor() {
    const accent = { value: new THREE.Color() };
    const time = { value: 0 };
    this.wallMaterial = new THREE.ShaderMaterial({
      uniforms: { uAccent: accent, uTime: time },
      vertexShader: 'varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: WALL_FRAGMENT,
      side: THREE.BackSide,
    });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(CAN.radius * 0.97, CAN.radius * 0.97, CAN.shellHeight, 48, 1, true), this.wallMaterial);

    // Bubbles: points inside the cylinder, animated in the vertex shader (no per-frame JS).
    const positions = new Float32Array(BUBBLES * 3);
    const seeds = new Float32Array(BUBBLES * 4);
    for (let i = 0; i < BUBBLES; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * CAN.radius * 0.88;
      positions.set([Math.cos(angle) * radius, 0, Math.sin(angle) * radius], i * 3);
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    const bubbleGeometry = new THREE.BufferGeometry();
    bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bubbleGeometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    this.bubbleMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uScale: { value: 1 }, uAccent: accent },
      vertexShader: BUBBLE_VERTEX,
      fragmentShader: BUBBLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bubbles = new THREE.Points(bubbleGeometry, this.bubbleMaterial);
    bubbles.frustumCulled = false;

    // Light from above: a soft additive cone with slow streaks.
    this.rayMaterial = new THREE.ShaderMaterial({
      uniforms: { uAccent: accent, uTime: time },
      vertexShader: 'varying vec2 vUv; varying vec3 vPos; void main() { vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: RAY_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(new THREE.ConeGeometry(CAN.radius * 0.9, CAN.shellHeight * 0.95, 40, 1, true), this.rayMaterial);
    ray.position.y = -CAN.shellHeight * 0.02;
    ray.rotation.x = Math.PI; // wide end up

    this.group.add(wall, bubbles, ray);
    this.group.visible = false;
    this.disposers.push(
      () => wall.geometry.dispose(),
      () => bubbleGeometry.dispose(),
      () => ray.geometry.dispose(),
      () => this.wallMaterial.dispose(),
      () => this.bubbleMaterial.dispose(),
      () => this.rayMaterial.dispose()
    );
  }

  /** Floating fruit for the flavor now in focus (rebuilt when the flavor changes). */
  private buildFruit(flavorIndex: number) {
    this.fruit.forEach(({ mesh }) => this.group.remove(mesh));
    this.disposers.splice(6).forEach((dispose) => dispose());
    this.fruit.length = 0;
    const recipe = RECIPES[FLAVORS[flavorIndex].id] ?? [];
    recipe.forEach((item) => {
      const count = Math.min(5, item.count);
      const { mesh, dispose } = buildFruitMesh(item.kind as Kind, count);
      const seeds = new Float32Array(count * 5);
      const colour = new THREE.Color(item.color);
      for (let i = 0; i < count; i += 1) {
        // Near the walls and away from the lens height: fruit drifts past at a distance instead of
        // filling the lens (the camera sits on the can's axis, a little above the middle).
        const angle = Math.random() * Math.PI * 2;
        const radius = CAN.radius * (0.6 + 0.28 * Math.random());
        const side = Math.random() < 0.5 ? -1 : 1;
        const y = side * (0.18 + 0.32 * Math.random()) * CAN.shellHeight;
        seeds.set([Math.cos(angle) * radius, y, Math.sin(angle) * radius, Math.random() * 6.28, 0.5 + Math.random() * 0.8], i * 5);
        mesh.setColorAt(i, colour);
      }
      mesh.count = count;
      this.group.add(mesh);
      this.fruit.push({ mesh, seeds });
      this.disposers.push(dispose);
    });
    this.builtFor = flavorIndex;
  }

  update(seconds: number, scene: SceneManager) {
    const p = scene.sectionPosition;
    // A smooth bump around the chapter: push in, hold, pull back out.
    const target = THREE.MathUtils.smoothstep(p, CHAPTER - 0.55, CHAPTER - 0.1) * (1 - THREE.MathUtils.smoothstep(p, CHAPTER + 0.1, CHAPTER + 0.55));
    this.amount += (target - this.amount) * 0.25;
    const t = scene.reducedMotion ? 0 : this.amount;
    const index = scene.carousel.getIndex();
    const can = scene.cans[index];
    const surface = getCanSurface(can);
    if (surface) surface.uDissolve.value = THREE.MathUtils.smoothstep(t, 0.5, 0.88);
    if (t < 0.002) {
      if (this.group.visible) {
        this.group.visible = false;
        this.group.removeFromParent();
        this.showEnds(can, true);
      }
      return;
    }

    if (this.group.parent !== can) {
      this.group.removeFromParent();
      can.add(this.group);
    }
    if (this.builtFor !== index) this.buildFruit(index);
    this.group.visible = true;
    this.wallMaterial.uniforms.uTime.value = seconds;
    this.wallMaterial.uniforms.uAccent.value.set(FLAVORS[index].theme.secondary);
    this.showEnds(can, t < 0.6);

    // Camera: along the line from the chapter pose to the can's centre, accelerating as it nears the label.
    const path = THREE.MathUtils.smoothstep(t, 0, 1);
    const push = path * path * (3 - 2 * path);
    this.target.setFromMatrixPosition(can.matrixWorld);
    this.target.y += 0.3 * can.scale.x;
    const d = scene.data;
    d.camPosX = THREE.MathUtils.lerp(d.camPosX, this.target.x, push);
    d.camPosY = THREE.MathUtils.lerp(d.camPosY, this.target.y, push);
    d.camPosZ = THREE.MathUtils.lerp(d.camPosZ, this.target.z + 0.2, push);
    d.fov = THREE.MathUtils.lerp(d.fov, 66, push);
    d.camRotX = THREE.MathUtils.lerp(d.camRotX, 0.34, push);
    d.camRotY = THREE.MathUtils.lerp(d.camRotY, 0, push);
    scene.fx.water = THREE.MathUtils.smoothstep(t, 0.72, 1);
    // the night behind the can steps back while we are inside
    d.mountains *= 1 - push;
    d.moon *= 1 - push;
    d.stars *= 1 - push;
    d.mistFg *= 1 - 0.7 * push;

    // Fruit drifts in slow circles; bubbles are animated by the GPU.
    this.bubbleMaterial.uniforms.uScale.value = can.scale.x * 0.55;
    this.fruit.forEach(({ mesh, seeds }) => {
      for (let i = 0; i < mesh.count; i += 1) {
        const o = i * 5;
        const phase = seeds[o + 3] + seconds * 0.35 * seeds[o + 4];
        this.dummy.position.set(seeds[o] + Math.sin(phase) * 0.12, seeds[o + 1] + Math.sin(phase * 0.7) * 0.2, seeds[o + 2] + Math.cos(phase) * 0.12);
        this.dummy.rotation.set(phase * 0.6, phase * 0.4, phase * 0.3);
        this.dummy.scale.setScalar(0.22 * (0.8 + 0.4 * seeds[o + 4]) * push);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  /** Hides the lid and base while the camera is inside (they would block the interior). */
  private showEnds(can: THREE.Object3D, visible: boolean) {
    ['Top', 'Bottom', 'TabPivot'].forEach((name) => {
      const part = can.getObjectByName(name);
      if (part) part.visible = visible;
    });
  }

  dispose() {
    this.group.removeFromParent();
    this.disposers.forEach((dispose) => dispose());
  }
}
