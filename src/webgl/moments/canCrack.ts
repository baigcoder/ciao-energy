import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { getCanParts } from '../canModel';
import { audioManager } from '../../audio/audioManager';

/**
 * Crack it open. Clicking the featured hero can (or pressing O) tips its lid toward the camera, lifts the tab with a
 * crack and a hiss, and a cold puff of mist rolls out of the opening; a moment later the tab closes and the can
 * settles back into the ring.
 *
 * Trigger: a click on the centre hero can without a drag, or the O key (SceneManager.crackOpen). Persists: nothing.
 * State/time-driven (3.2 s). WebGL: the featured can's offset pose, its tab and opening, the stage's mist burst and
 * flash. Optional: under reduced motion the tab still lifts and the sound plays, without the tilt or the mist.
 * Fallback: nothing essential lives in the effect.
 */
const DURATION = 3.2;
const CRACK_AT = 0.55;

const ease = (t: number) => t * t * (3 - 2 * t);

export class CanCrack implements SceneMoment {
  private start = -1;
  private armed = false;
  private cracked = false;
  private index = -1;
  private readonly lid = new THREE.Vector3();

  /** Plays once; ignored while a crack is already running. */
  trigger(canIndex: number) {
    if (this.armed) return;
    this.armed = true;
    this.start = -1;
    this.cracked = false;
    this.index = canIndex;
  }

  get active() {
    return this.armed;
  }

  update(seconds: number, scene: SceneManager) {
    if (!this.armed) return;
    if (this.start < 0) this.start = seconds;
    const t = seconds - this.start;
    const can = scene.cans[this.index];
    const parts = can ? getCanParts(can) : undefined;
    // the ring moved on (swipe, scroll): let go at once
    if (!can || t > DURATION || scene.data.wave < 0.6 || scene.featuredCanIndex() !== this.index) {
      this.finish(parts);
      return;
    }

    const motion = scene.reducedMotion ? 0 : 1;
    const tilt = ease(THREE.MathUtils.clamp(t / 0.4, 0, 1)) * (1 - ease(THREE.MathUtils.clamp((t - 2.5) / 0.7, 0, 1)));
    const o = scene.featuredOffset;
    o.rotX += 0.85 * tilt * motion;
    o.posZ += 1.4 * tilt * motion;
    o.posY -= 0.35 * tilt * motion;

    if (parts) {
      const lift = ease(THREE.MathUtils.clamp((t - 0.35) / 0.25, 0, 1));
      const close = 1 - ease(THREE.MathUtils.clamp((t - 2.3) / 0.4, 0, 1));
      parts.tabPivot.rotation.x = -1.15 * lift * close;
      parts.opening.visible = lift > 0.8 && close > 0.05;
    }
    if (!this.cracked && t > CRACK_AT) {
      this.cracked = true;
      audioManager.play('open');
    }
    if (this.cracked && motion) {
      const after = t - CRACK_AT;
      this.lid.set(0, 2.2, -0.2).applyMatrix4(can.matrixWorld).project(scene.camera);
      scene.fx.burstPos.set(this.lid.x * 0.5 + 0.5, this.lid.y * 0.5 + 0.5);
      const puff = Math.exp(-after * 1.8);
      const roll = THREE.MathUtils.smoothstep(after, 0, 0.5) * (1 - THREE.MathUtils.smoothstep(t, 2.2, DURATION));
      scene.fx.burst = Math.max(scene.fx.burst, 0.45 * puff + 0.35 * roll);
      scene.fx.flash = Math.max(scene.fx.flash, 0.25 * Math.exp(-after * 14));
    }
  }

  private finish(parts: ReturnType<typeof getCanParts>) {
    this.armed = false;
    if (parts) {
      parts.tabPivot.rotation.x = 0;
      parts.opening.visible = false;
    }
  }

  dispose() {
    this.armed = false;
  }
}
