import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';
import { FRUIT_COLOR, FRUIT_PIECE_COLOR } from '../palette';

/**
 * Fruit and ice that travel with the flavor colour wave. When the carousel turns, the new
 * flavor's fruit bursts out of the focused can and sweeps sideways through the scene while the
 * stage floods with the new colour. Small instanced meshes (a few draw calls, no allocation per
 * frame); everything is generated in code (no fruit photos).
 *
 * Trigger: flavor change. State-driven (time since burst). WebGL: instanced meshes lit by the
 * scene lights. Optional: skipped for reduced motion and the low tier. Fallback: none needed,
 * the colour wipe and the can spin carry the change on their own.
 */
export type Kind = 'berry' | 'round' | 'ice' | 'slice-kiwi' | 'slice-melon' | 'slice-mango' | 'slice-peach';

export interface Recipe {
  kind: Kind;
  color: number;
  count: number;
  size: number;
}

/** What each flavor throws: fruit tints are the only literal colours outside the label art. */
export const RECIPES: Record<string, Recipe[]> = {
  'blue-raspberry': [
    { kind: 'berry', color: FRUIT_PIECE_COLOR.berryBlue, count: 9, size: 0.42 },
    { kind: 'ice', color: FRUIT_PIECE_COLOR.ice, count: 4, size: 0.5 },
  ],
  'mango-fuego': [
    { kind: 'round', color: FRUIT_PIECE_COLOR.mango, count: 6, size: 0.62 },
    { kind: 'slice-mango', color: FRUIT_PIECE_COLOR.texture, count: 4, size: 0.8 },
  ],
  watermelon: [
    { kind: 'slice-melon', color: FRUIT_PIECE_COLOR.texture, count: 7, size: 0.85 },
    { kind: 'round', color: FRUIT_PIECE_COLOR.melonRind, count: 2, size: 0.5 },
  ],
  'strawberry-kiwi': [
    { kind: 'round', color: FRUIT_PIECE_COLOR.strawberry, count: 6, size: 0.5 },
    { kind: 'slice-kiwi', color: FRUIT_PIECE_COLOR.texture, count: 5, size: 0.78 },
  ],
  peach: [
    { kind: 'round', color: FRUIT_PIECE_COLOR.peach, count: 6, size: 0.62 },
    { kind: 'slice-peach', color: FRUIT_PIECE_COLOR.texture, count: 4, size: 0.8 },
  ],
  'blackout-berry': [{ kind: 'berry', color: FRUIT_PIECE_COLOR.blackoutBerry, count: 12, size: 0.42 }],
};

const CAPACITY = 24;
const KINDS: Kind[] = ['berry', 'round', 'ice', 'slice-kiwi', 'slice-melon', 'slice-mango', 'slice-peach'];

/** Radial cross-section texture for the fruit slices. */
function sliceTexture(kind: Kind): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  if (ctx) {
    const disc = (radius: number, colour: string) => {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(c, c, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    if (kind === 'slice-kiwi') {
      disc(c, FRUIT_COLOR.kiwi.rind);
      disc(c * 0.93, FRUIT_COLOR.kiwi.flesh);
      disc(c * 0.3, FRUIT_COLOR.kiwi.core);
      ctx.fillStyle = FRUIT_COLOR.kiwi.seed;
      for (let i = 0; i < 28; i += 1) {
        const a = (i / 28) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(a) * c * 0.52, c + Math.sin(a) * c * 0.52, 4, 8, a + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'slice-melon') {
      disc(c, FRUIT_COLOR.melon.rind);
      disc(c * 0.9, FRUIT_COLOR.melon.pith);
      disc(c * 0.84, FRUIT_COLOR.melon.flesh);
      ctx.fillStyle = FRUIT_COLOR.melon.seed;
      for (let i = 0; i < 14; i += 1) {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        const r = c * (0.3 + 0.28 * ((i * 7) % 3) / 2);
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, 4, 8, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'slice-mango') {
      disc(c, FRUIT_COLOR.mango.skin);
      disc(c * 0.93, FRUIT_COLOR.mango.flesh);
      disc(c * 0.2, FRUIT_COLOR.mango.core);
    } else {
      disc(c, FRUIT_COLOR.peach.skin);
      disc(c * 0.93, FRUIT_COLOR.peach.flesh);
      disc(c * 0.22, FRUIT_COLOR.peach.stone);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface Piece {
  kind: number;
  slot: number;
  born: number;
  life: number;
  origin: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  size: number;
}

/** One instanced mesh for a kind of fruit, with its own material (and slice texture when needed). */
export function buildFruitMesh(kind: Kind, capacity: number): { mesh: THREE.InstancedMesh; dispose: () => void } {
  const geometry: THREE.BufferGeometry =
    kind === 'berry'
      ? bumpy(new THREE.SphereGeometry(0.5, 40, 28))
      : kind === 'round'
        ? new THREE.SphereGeometry(0.5, 20, 14)
        : kind === 'ice'
          ? new RoundedBoxGeometry(0.8, 0.8, 0.8, 4, 0.12)
          : new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
  let map: THREE.CanvasTexture | null = null;
  let material: THREE.Material;
  if (kind.startsWith('slice')) {
    map = sliceTexture(kind);
    material = new THREE.MeshStandardMaterial({ map, roughness: 0.35, metalness: 0, emissive: FRUIT_PIECE_COLOR.texture, emissiveMap: map, emissiveIntensity: 0.18 });
  } else if (kind === 'ice') {
    material = new THREE.MeshPhysicalMaterial({ color: FRUIT_PIECE_COLOR.texture, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.5, clearcoat: 1, envMapIntensity: 1.6 });
  } else {
    material = new THREE.MeshStandardMaterial({ color: FRUIT_PIECE_COLOR.texture, roughness: kind === 'berry' ? 0.28 : 0.4, metalness: 0, emissive: FRUIT_PIECE_COLOR.texture, emissiveIntensity: 0.0 });
  }
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      map?.dispose();
      mesh.dispose();
    },
  };
}

export class FruitField implements SceneMoment {
  private readonly meshes: THREE.InstancedMesh[] = [];
  private readonly counts: number[] = KINDS.map(() => 0);
  private readonly pieces: Piece[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly colour = new THREE.Color();
  private readonly origin = new THREE.Vector3();
  private pendingBurst = -1;
  private clock = 0;

  private readonly disposers: Array<() => void> = [];

  constructor(private readonly host: SceneManager) {
    KINDS.forEach((kind) => {
      const { mesh, dispose } = buildFruitMesh(kind, CAPACITY);
      mesh.count = 0;
      mesh.visible = false;
      host.scene.add(mesh);
      this.meshes.push(mesh);
      this.disposers.push(dispose);
    });
  }

  /** Starts a burst for a flavor (called when the carousel turns). */
  burst(flavorIndex: number) {
    if (this.host.reducedMotion || this.host.quality === 'LOW') return;
    this.pendingBurst = flavorIndex;
  }

  private spawn(flavorIndex: number, seconds: number) {
    const flavor = FLAVORS[flavorIndex % FLAVORS.length];
    const recipe = RECIPES[flavor.id] ?? [];
    const focus = this.host.cans[this.host.carousel.getIndex()];
    this.origin.setFromMatrixPosition(focus.matrixWorld);
    this.origin.z -= 0.4;
    this.pieces.length = 0;
    this.counts.fill(0);
    let n = 0;
    recipe.forEach((item) => {
      const kind = KINDS.indexOf(item.kind);
      for (let i = 0; i < item.count && this.counts[kind] < CAPACITY; i += 1) {
        const side = n % 2 === 0 ? -1 : 1;
        // the wave travels sideways: pieces fan out left and right, near ones big, far ones small
        const speed = 2.6 + Math.random() * 3.4;
        const spread = (Math.random() - 0.5) * 2.2;
        const slot = this.counts[kind]++;
        this.pieces.push({
          kind,
          slot,
          born: seconds + n * 0.035,
          life: 2.2 + Math.random() * 1.2,
          origin: this.origin.clone(),
          velocity: new THREE.Vector3(side * speed, spread + 0.6, (Math.random() - 0.35) * 4.2),
          spin: new THREE.Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3),
          size: item.size * 1.3 * (0.7 + Math.random() * 0.6),
        });
        const mesh = this.meshes[kind];
        this.colour.setHex(item.color);
        mesh.setColorAt(slot, this.colour);
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        n += 1;
      }
    });
    this.meshes.forEach((mesh, i) => {
      mesh.count = this.counts[i];
      mesh.visible = this.counts[i] > 0;
    });
  }

  /** Removes everything in flight (route changes). */
  clear() {
    this.pieces.length = 0;
    this.meshes.forEach((mesh) => {
      mesh.count = 0;
      mesh.visible = false;
    });
  }

  update(seconds: number) {
    this.clock = seconds;
    if (this.pendingBurst >= 0) {
      this.spawn(this.pendingBurst, seconds);
      this.pendingBurst = -1;
    }
    if (this.pieces.length === 0) return;
    let alive = 0;
    this.pieces.forEach((piece) => {
      const t = seconds - piece.born;
      const mesh = this.meshes[piece.kind];
      if (t < 0 || t > piece.life) {
        // hide: zero scale
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.setScalar(0.0001);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(piece.slot, this.dummy.matrix);
        return;
      }
      alive += 1;
      const k = t / piece.life;
      const travel = 1 - (1 - Math.min(1, t / (piece.life * 0.8))) ** 3;
      this.dummy.position.copy(piece.origin).addScaledVector(piece.velocity, travel * 1.5);
      this.dummy.position.y += Math.sin(t * 2.2 + piece.slot) * 0.12 - 0.4 * t * t * 0.3;
      this.dummy.rotation.set(piece.spin.x * t, piece.spin.y * t, piece.spin.z * t);
      // pop in, hold, shrink out
      const pop = THREE.MathUtils.smoothstep(k, 0, 0.1) * (1 - THREE.MathUtils.smoothstep(k, 0.72, 1));
      this.dummy.scale.setScalar(piece.size * pop + 0.0001);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(piece.slot, this.dummy.matrix);
    });
    this.meshes.forEach((mesh) => (mesh.instanceMatrix.needsUpdate = true));
    if (alive === 0) {
      this.pieces.length = 0;
      this.meshes.forEach((mesh) => {
        mesh.count = 0;
        mesh.visible = false;
      });
    }
  }

  dispose() {
    this.meshes.forEach((mesh) => mesh.removeFromParent());
    this.disposers.forEach((dispose) => dispose());
    void this.clock;
  }
}

/** Gives a berry its drupelet bumps: a deterministic radial jitter of the vertices. */
function bumpy(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    const bump = 1 + 0.06 * Math.sin(v.x * 21.0) * Math.sin(v.y * 19.0) * Math.sin(v.z * 23.0);
    v.multiplyScalar(bump);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
