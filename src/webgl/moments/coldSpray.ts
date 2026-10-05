import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { CAN } from '../canDimensions';

/**
 * Cold spray. When the visitor scrolls fast, ice-cold water flings off the featured can: droplets leave its surface
 * along the normal, arc up and out, fall under gravity and fade, and a breath of cold vapour rises off the lid. The
 * faster the scroll, the more water; at rest the can just keeps its condensation.
 *
 * Trigger: scroll speed (SceneManager.scrollVelocity) above a threshold, on the home route. Persists: nothing.
 * Scroll-driven emission, time-driven flight. WebGL: one Points cloud from a fixed pool (no per-frame allocation)
 * and the stage's mist burst. Optional: off under reduced motion; fewer droplets on low-power devices. Fallback: the
 * can's own condensation and running drops.
 */
const GRAVITY = 7.5;
const DRAG = 1.6; // per second

const VERTEX = /* glsl */ `
  attribute float aLife;   // 1 just thrown .. 0 gone
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vLife;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aLife > 0.0 ? aSize * uPixelRatio * (30.0 / max(1.0, -mv.z)) : 0.0;
    vLife = aLife;
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vLife;
  void main() {
    // a cold water bead: clear centre, bright fresnel rim, a hot key highlight up-left, a faint caustic opposite
    vec2 c = (gl_PointCoord - 0.5) * 2.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float n = sqrt(1.0 - r2);
    float rim = pow(1.0 - n, 1.8);
    float key = pow(max(0.0, dot(normalize(vec3(c, n)), normalize(vec3(-0.45, 0.55, 0.7)))), 28.0);
    float caustic = smoothstep(0.4, 0.0, length(c - vec2(0.3, -0.35))) * 0.3;
    float fade = smoothstep(0.0, 0.25, vLife);
    float a = (rim * 0.8 + key * 1.4 + caustic + 0.08) * fade;
    gl_FragColor = vec4(vec3(0.82, 0.93, 1.0) * a, a);
  }
`;

export class ColdSpray implements SceneMoment {
  private readonly count: number;
  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly lifeAttr: THREE.BufferAttribute;
  private readonly posAttr: THREE.BufferAttribute;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;
  private readonly points: THREE.Points;
  private readonly local = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly lid = new THREE.Vector3();
  private cursor = 0;
  private carry = 0;
  private alive = 0;
  private lastSeconds = -1;

  constructor(host: SceneManager) {
    this.count = host.isLowPower ? 320 : 700;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.life = new Float32Array(this.count);
    this.maxLife = new Float32Array(this.count).fill(1);
    const sizes = new Float32Array(this.count);
    for (let i = 0; i < this.count; i += 1) sizes[i] = 2 + Math.random() ** 3 * 9; // mostly fine spray, a few big drops
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.lifeAttr = new THREE.BufferAttribute(new Float32Array(this.count), 1);
    this.lifeAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aLife', this.lifeAttr);
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.material = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;
    host.scene.add(this.points);
  }

  /** Throws one droplet off the can's surface at a random point, along the surface normal. */
  private spawn(can: THREE.Object3D, scale: number, scrollDir: number) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.count;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * CAN.shellHeight * 0.9;
    this.local.set(Math.cos(angle) * CAN.radius, height, Math.sin(angle) * CAN.radius).applyMatrix4(can.matrixWorld);
    this.normal.set(Math.cos(angle), 0, Math.sin(angle)).transformDirection(can.matrixWorld);
    const speed = (1.4 + Math.random() * 2.2) * Math.min(1.6, scale);
    const o = i * 3;
    this.positions[o] = this.local.x;
    this.positions[o + 1] = this.local.y;
    this.positions[o + 2] = this.local.z;
    // outward, a little up, and left behind by the scroll (the can moves on, the water does not)
    this.velocities[o] = this.normal.x * speed;
    this.velocities[o + 1] = this.normal.y * speed + 1.2 + Math.random() * 1.6 + scrollDir * 1.4;
    this.velocities[o + 2] = this.normal.z * speed;
    this.maxLife[i] = 0.9 + Math.random() * 0.8;
    if (this.life[i] <= 0) this.alive += 1;
    this.life[i] = this.maxLife[i];
  }

  update(seconds: number, scene: SceneManager) {
    const dt = this.lastSeconds < 0 ? 0 : Math.min(0.05, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    const speed = Math.abs(scene.scrollVelocity);
    const can = scene.cans[scene.featuredCanIndex()];
    const canThrow = !scene.reducedMotion && can?.visible && scene.data.swirl < 0.5;

    if (canThrow && speed > 0.35 && dt > 0) {
      // droplets per second grow with the scroll speed (sections per second)
      this.carry += Math.min(900, (speed - 0.35) * 420) * dt;
      const scrollDir = Math.sign(scene.scrollVelocity);
      while (this.carry >= 1) {
        this.carry -= 1;
        this.spawn(can, can.scale.x, scrollDir);
      }
      // a breath of cold vapour off the lid
      this.lid.set(0, CAN.shellHeight / 2 + CAN.topHeight, 0).applyMatrix4(can.matrixWorld).project(scene.camera);
      scene.fx.burstPos.set(this.lid.x * 0.5 + 0.5, this.lid.y * 0.5 + 0.5);
      scene.fx.burst = Math.max(scene.fx.burst, Math.min(0.22, (speed - 0.35) * 0.12));
    } else {
      this.carry = 0;
    }

    if (this.alive === 0) {
      this.points.visible = false;
      return;
    }
    // integrate: gravity and air drag; dead droplets are parked (size 0 in the shader)
    const drag = Math.exp(-DRAG * dt);
    const lifeOut = this.lifeAttr.array as Float32Array;
    for (let i = 0; i < this.count; i += 1) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.life[i] = 0;
        lifeOut[i] = 0;
        this.alive -= 1;
        continue;
      }
      const o = i * 3;
      this.velocities[o] *= drag;
      this.velocities[o + 1] = this.velocities[o + 1] * drag - GRAVITY * dt;
      this.velocities[o + 2] *= drag;
      this.positions[o] += this.velocities[o] * dt;
      this.positions[o + 1] += this.velocities[o + 1] * dt;
      this.positions[o + 2] += this.velocities[o + 2] * dt;
      lifeOut[i] = this.life[i] / this.maxLife[i];
    }
    this.posAttr.needsUpdate = true;
    this.lifeAttr.needsUpdate = true;
    this.material.uniforms.uPixelRatio.value = scene.renderer.getPixelRatio();
    this.points.visible = true;
  }

  dispose() {
    this.points.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}
