/** Opening settings the UI needs (kept free of three.js so the first bundle stays small). */
export const OPENING_SESSION_KEY = 'grizzly_opened_v1';

/** How long the opening needs before the loader may leave. */
export const OPENING_MIN_SECONDS = 3.0;

/** The opening plays once per session (and never for reduced motion; the app checks that). */
export function openingShouldPlay(): boolean {
  try {
    return window.sessionStorage.getItem(OPENING_SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}
