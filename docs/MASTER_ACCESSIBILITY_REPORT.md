# Ciao Energy — Master Accessibility Report

**Date:** 2026-09-30

## Confirmed

- Page text, catalog facts, navigation, FAQ, and commerce controls exist in DOM, not only in WebGL.
- Browser accessibility tree exposes the home flavor selector, route links/buttons, shop filters and pack radio groups, PDP pack selection, quantity controls, accordions, and related products.
- Focus-visible design tokens and outlines exist globally. Audio starts OFF. Search, menu, cart, and FAQ use semantic controls.
- PDP front/nutrition/back controls now call real scene targets; drag listeners are attached to the viewer stage, ignore its buttons, and use Pointer Events with pointer capture. Touch vertical panning remains enabled.
- On mobile, the menu text is visually hidden while its accessible button name remains.
- Reduced-motion CSS disables decorative atmosphere/pulse animation. Scene initialization selects lower quality under the preference.

## Not verified in this turn

- Full keyboard-only walkthrough for each drawer, search, menu, cart, FAQ and all six shop filter/pack states.
- Screen-reader behavior across multiple browser/assistive-technology combinations, measured WCAG contrast for all muted text, reduced-motion scene behavior during live scroll, and touch target dimensions at each required viewport.
- WebGL unavailable/context-loss recovery, keyboard drag alternative for the 3D viewer, mobile switch/rotation behavior, and newsletter invalid/server-error states.

## Open accessibility issue

3D rotation still has pointer/touch controls only; a keyboard-accessible equivalent should be added before release. Product information remains present in DOM if the viewer is unavailable.
