import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { getCanParts, setCanLidExposure } from '../canModel';
import { audioManager } from '../../audio/audioManager';

/**
 * Opening. A black screen; a can's lid fills the frame, the tab lifts with a crack and a hiss,
 * cold mist rolls out of the opening. While the loader finishes, the DOM wordmark forms in brushed
 * silver over the mist; when the loader leaves, the can settles into the hero and the ring rises.
 *
 * Trigger: scene start (armed by App when the home route loads, once per session). Persists: the
 * session flag only. Time-driven (no scroll or pointer). WebGL: the can pose, tab, stage fade and
 * the foreground mist burst; DOM: the wordmark and percentage. Optional: skipped for reduced motion
 * and on repeat visits in the same session (a shorter loader plays instead). Fallback: the loader
 * alone, on black.
 */
const TAB_START = 0.9;
const TAB_END = 1.2;
const CRACK_AT = 1.12;
const RETURN_TIME = 1.7;
import { OPENING_SESSION_KEY as SESSION_KEY } from './openingConfig';

const easeInOut = (t: number) => t * t * (3 - 2 * t);

export class OpeningMoment implements SceneMoment {
  private state: 'idle' | 'holding' | 'returning' | 'done' = 'idle';
  private startedAt = -1;
  private releasedAt = -1;
  private cracked = false;
  private readonly lid = new THREE.Vector3();


  /** Starts the opening clock on the next frame. */
  arm() {
    if (this.state !== 'idle') return;
    this.state = 'holding';
    this.startedAt = -1;
  }

  /** The loader is leaving: pull the can into the hero and let the stage light up. */
  release() {
    if (this.state !== 'holding') return;
    this.releasedAt = -2; // resolved on the next frame (needs the scene clock)
  }

  update(seconds: number, scene: SceneManager) {
    if (this.state === 'idle' || this.state === 'done') return;
    if (this.startedAt < 0) this.startedAt = seconds;
    if (this.releasedAt === -2) {
      this.releasedAt = seconds;
      this.state = 'returning';
    }
    const t = seconds - this.startedAt;
    const r = this.state === 'returning' ? (seconds - this.releasedAt) / RETURN_TIME : 0;
    const canIndex = scene.carousel.getIndex();
    const can = scene.cans[canIndex];
    const parts = getCanParts(can);

    // The can stands close, lid toward the camera, rising slowly out of the dark.
    const hold = 1 - easeInOut(THREE.MathUtils.clamp(r, 0, 1));
    const drift = Math.sin(t * 0.6) * 0.04;
    const o = scene.canOverride;
    o.index = canIndex;
    o.blend = hold;
    o.scale = 3.3 + 0.05 * Math.sin(t * 0.4);
    o.position.set(0, -4.4, 1.6);
    o.rotation.set(1.12 + drift * 0.5, -0.25 + drift, 0.05);

    // The lid is held in a dark, cold light: only its rim and a slow glint catch the key.
    setCanLidExposure(can, THREE.MathUtils.lerp(0.16, 1, easeInOut(THREE.MathUtils.clamp(r * 1.2, 0, 1))));

    // The tab lifts, cracks, and stays up until the can goes back to the hero.
    if (parts) {
      const lift = easeInOut(THREE.MathUtils.clamp((t - TAB_START) / (TAB_END - TAB_START), 0, 1));
      const close = 1 - easeInOut(THREE.MathUtils.clamp((r - 0.25) / 0.4, 0, 1));
      parts.tabPivot.rotation.x = -1.15 * lift * close;
      parts.opening.visible = lift > 0.8 && close > 0.05;
    }
    if (!this.cracked && t > CRACK_AT) {
      this.cracked = true;
      audioManager.play('open');
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // storage blocked: the opening may replay, harmless
      }
    }
    const afterCrack = Math.max(0, t - CRACK_AT);
    if (this.cracked) {
      this.lid.set(0, 2.2, -0.2).applyMatrix4(can.matrixWorld).project(scene.camera);
      scene.fx.burstPos.set(this.lid.x * 0.5 + 0.5, this.lid.y * 0.5 + 0.5);
      // pressure release: a hard puff, then a long soft roll
      const puff = Math.exp(-afterCrack * 1.6);
      const roll = THREE.MathUtils.smoothstep(afterCrack, 0, 1.2) * (1 - THREE.MathUtils.clamp(r, 0, 1));
      scene.fx.burst = Math.max(scene.fx.burst, Math.min(1.1, 0.35 + 0.8 * puff) * roll + 0.4 * puff);
      scene.fx.flash = Math.max(scene.fx.flash, 0.3 * Math.exp(-afterCrack * 14));
    }

    // The stage stays black until the can is released, then the night comes up behind it.
    const fade = this.state === 'returning' ? easeInOut(THREE.MathUtils.clamp(r * 1.25, 0, 1)) : 0;
    const d = scene.data;
    d.mountains *= fade;
    d.moon *= fade;
    d.stars *= fade;
    d.glow *= fade;
    d.mistFg *= 0.4 + 0.6 * fade;
    d.reflect *= fade;

    if (this.state === 'returning' && r >= 1) {
      this.state = 'done';
      setCanLidExposure(can, 1);
      o.blend = 0;
      o.index = -1;
      if (parts) {
        parts.tabPivot.rotation.x = 0;
        parts.opening.visible = false;
      }
    }
  }

  dispose() {
    this.state = 'done';
  }
}
