import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { FLAVORS } from '../../data/flavors';

/**
 * Finale. All six cans drop into a mountain-shaped lineup (positions and the drop are in
 * SceneManager.layoutCans); this moment lights each one in its own colour: a soft additive glow
 * behind the can and a stronger rim light, both in the flavor accent, after the can lands.
 *
 * Trigger: the lineup section (timeline `swirl`). Scroll-driven (via swirl) plus a small
 * time-based breathing. WebGL: six camera-facing sprites. DOM: the shop button (FullGammeSection).
 * Optional: the glow is skipped on the low tier. Fallback: the lit cans alone.
 */
function glowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.32)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class FinaleGlow implements SceneMoment {
  private readonly sprites: THREE.Sprite[] = [];
  private readonly texture = glowTexture();

  constructor(host: SceneManager) {
    FLAVORS.forEach((flavor) => {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: new THREE.Color(flavor.theme.secondary),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.renderOrder = -300;
      host.scene.add(sprite);
      this.sprites.push(sprite);
    });
  }

  update(seconds: number, scene: SceneManager) {
    const swirl = scene.data.swirl;
    const lit = THREE.MathUtils.smoothstep(swirl, 0.7, 1);
    // every can in the row gets its flavor-coloured rim; the soft colour pools sit behind one of each
    scene.cans.forEach((can) => {
      can.userData.rimBoost = lit * 1.1;
    });
    this.sprites.forEach((sprite, i) => {
      const can = scene.cans[i];
      const material = sprite.material as THREE.SpriteMaterial;
      const show = lit > 0.01 && scene.quality !== 'LOW' && can.visible;
      sprite.visible = show;
      if (!show) return;
      const breathe = scene.reducedMotion ? 1 : 0.9 + 0.1 * Math.sin(seconds * 0.7 + i * 1.3);
      material.opacity = 0.22 * lit * breathe;
      const size = 5.2 * can.scale.x;
      sprite.scale.set(size, size * 1.15, 1);
      sprite.position.set(can.position.x, can.position.y + 0.1, can.position.z - 1.4);
    });
  }

  dispose() {
    this.sprites.forEach((sprite) => {
      sprite.removeFromParent();
      (sprite.material as THREE.Material).dispose();
    });
    this.texture.dispose();
  }
}
