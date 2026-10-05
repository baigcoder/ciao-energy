import * as THREE from 'three';
import type { SceneManager } from '../sceneManager';
import type { SceneMoment } from './types';
import { getCanSurface } from '../canModel';

/**
 * Ice cold. When the featured can arrives in the hero, the flavor intro or the tagline, frost creeps up its label from
 * the base along a ragged front, holds for a breath, then melts away and leaves the can running wet with beads.
 *
 * Trigger: the scroll settling on one of those sections (once per arrival). Time-driven after that (≈4.5 s). WebGL
 * only: the featured can's uFrost / uWet uniforms (canModel). Optional: skipped under reduced motion. Fallback: the
 * regular condensation.
 */
const SECTIONS = new Set([0, 1, 6]); // hero, flavor intro, tagline
const GROW = 0.7;
const HOLD = 1.5;
const MELT = 3.6;
const WET_END = 6.5;

export class FrostMelt implements SceneMoment {
  private arrived = -1;
  private start = -1;
  private canIndex = -1;

  update(seconds: number, scene: SceneManager) {
    const p = scene.sectionPosition;
    const nearest = Math.round(p);
    const settled = Math.abs(p - nearest) < 0.06 && Math.abs(scene.scrollVelocity) < 0.3;
    if (settled && nearest !== this.arrived) {
      this.arrived = nearest;
      if (SECTIONS.has(nearest) && !scene.reducedMotion) {
        this.clear(scene);
        this.start = seconds;
        this.canIndex = scene.featuredCanIndex();
      }
    } else if (!settled && Math.abs(p - this.arrived) > 0.5) {
      this.arrived = -1; // left the section: the next arrival frosts again
    }
    if (this.start < 0) return;

    const t = seconds - this.start;
    const surface = getCanSurface(scene.cans[this.canIndex]);
    if (!surface || t > WET_END || scene.featuredCanIndex() !== this.canIndex) {
      this.clear(scene);
      return;
    }
    const grow = THREE.MathUtils.smoothstep(t, 0, GROW);
    const melt = 1 - THREE.MathUtils.smoothstep(t, HOLD, MELT);
    surface.uFrost.value = grow * melt;
    // the wet film builds as the frost turns to water, then slowly dries back to the usual beads
    surface.uWet.value = THREE.MathUtils.smoothstep(t, HOLD, MELT) * (1 - THREE.MathUtils.smoothstep(t, MELT + 0.5, WET_END));
  }

  private clear(scene: SceneManager) {
    if (this.canIndex >= 0) {
      const surface = getCanSurface(scene.cans[this.canIndex]);
      if (surface) {
        surface.uFrost.value = 0;
        surface.uWet.value = 0;
      }
    }
    this.start = -1;
    this.canIndex = -1;
  }

  dispose() {
    this.start = -1;
  }
}
