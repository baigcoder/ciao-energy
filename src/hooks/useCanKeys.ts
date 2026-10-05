import { useEffect } from 'react';
import type { SceneManager } from '../webgl/sceneManager';

/** Keys that turn the can: yaw for left/right, pitch for W/S or Shift + up/down. */
const STEP_YAW = 0.35;
const STEP_PITCH = 0.15;

/** True when the key belongs to whatever has focus (typing, a slider, the product stage, menus). */
function focusOwnsKeys(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || element === document.body) return false;
  if (element.isContentEditable) return true;
  if (element.closest('input, textarea, select, [role="slider"], [role="dialog"], [role="radiogroup"], [data-owns-arrows]')) return true;
  return false;
}

/**
 * Model-viewer keys for the 3D can. Home: ← → spin the featured can, Shift + ↑ ↓ (or W / S) tilt it, O opens it;
 * plain ↑ ↓ keep scrolling the page. Product page: the arrows turn the can from anywhere on the
 * page. Nothing happens while focus is in a field, a slider or a dialog.
 */
export function useCanKeys(route: 'HOME' | 'PRODUCT' | 'OTHER', sceneRef: React.MutableRefObject<SceneManager | null>) {
  useEffect(() => {
    if (route === 'OTHER') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (focusOwnsKeys(event.target)) return;
      const scene = sceneRef.current;
      if (!scene) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === 'o' && route === 'HOME') {
        // O cracks the centre hero can open (the same as clicking it)
        event.preventDefault();
        scene.crackOpen();
        return;
      }
      let yaw = 0;
      let pitch = 0;
      if (key === 'ArrowLeft' || key === 'a') yaw = -1;
      else if (key === 'ArrowRight' || key === 'd') yaw = 1;
      else if (key === 'w' || (key === 'ArrowUp' && (event.shiftKey || route === 'PRODUCT'))) pitch = -1;
      else if (key === 's' || (key === 'ArrowDown' && (event.shiftKey || route === 'PRODUCT'))) pitch = 1;
      else return;
      event.preventDefault();
      if (route === 'PRODUCT') scene.rotateProduct(yaw * 40, pitch * 30);
      else scene.turnCan(yaw * STEP_YAW, pitch * STEP_PITCH);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [route, sceneRef]);
}
