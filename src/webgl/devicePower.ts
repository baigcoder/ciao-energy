/**
 * One definition of "low-power device" shared by the app shell and the scene (no three.js import, so the shell can
 * ask before deciding to load the 3D chunk at all). Phones and tablets take the lighter render tier.
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < 1024 || /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
}
