import type { SceneManager } from '../sceneManager';

/**
 * A signature moment: a self-contained piece of choreography (opening, roar, inside the can, ...)
 * that adjusts the scene a little each frame, after the section poses are computed and before the
 * frame is rendered. Moments never own the render loop and always clean up after themselves.
 */
export interface SceneMoment {
  /** `seconds` is the scene clock in seconds. */
  update(seconds: number, scene: SceneManager): void;
  dispose(): void;
}
