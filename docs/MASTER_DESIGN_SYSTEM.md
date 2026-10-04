# Ciao Energy — Master Design System

**Date:** 2026-09-30  
**Scope:** Shared design rules for the Ciao Energy web experience, based on the supplied reference captures and [ciaoenergy.com](https://www.ciaoenergy.com/).

## Context and goals

Ciao Energy must present each drink as a vivid physical object inside a quiet, premium product theatre. Product discovery, flavor storytelling, and buying actions must remain clear across home, shop, product detail, and mobile layouts. This document turns that intent into shared implementation rules.

## Design tokens and foundations

Component styles must use the semantic tokens in `src/styles/tokens.css`; components must not introduce one-off color, spacing, typography, radius, shadow, or motion values.

| Token family | Required value / rule |
|---|---|
| `font.family.primary` | `Geist, Arial, sans-serif` |
| `font.size.base` / `font.weight.base` / `font.lineHeight.base` | `14px` / `300` / `21px` |
| Type scale | `xs 10.5px`, `sm 12.25px`, `md 14px`, `lg 15.75px`, `xl 16px`, `2xl 17.5px`, `3xl 42px`, `4xl 63px` |
| `color.text.primary` / `color.surface.base` | `#ffffff` / `#000000` |
| Spacing | `space.1 3.5px`, `space.2 10.5px`, `space.3 12.6px`, `space.4 17.5px`, `space.5 21px`, `space.6 21.5px`; use existing larger scale steps where needed |
| Radius | `radius.xs 3.5px`, `radius.sm 7px`, `radius.md 768px` (pill) |
| Shadows | `shadow.1 rgba(255,255,255,.6) 0 0 20px`; `shadow.2 rgba(255,255,255,.2) 0 0 0 1px` |
| Motion | `motion.duration.instant 200ms`; `motion.duration.fast 400ms`; use the shared easing token |

The visual canvas must stay near-black and white. Flavor color should come from product artwork, product-stage lighting, and a restrained local atmosphere token. Supporting copy must use the shared secondary/muted text tokens with sufficient contrast. Display headings may use the existing bold italic brand face as a semantic display role; reading text and controls must use Geist. Layout must use the shared page inset and container tokens.

## Component rules

Every component family must define default, hover, focus-visible, active, disabled, loading, and error states. Unsupported states must have an explicit documented treatment (for example, a static content region has no disabled state). Every family must use token-backed spacing and typography, support keyboard, pointer, and touch input, and define responsive, long-content, overflow, and empty-state behavior.

### Global navigation and overlays

- Anatomy: persistent brand link, primary route/menu action, search, cart, and contact action. On small screens, controls must use accessible icon names and must not overlap the brand.
- Keyboard and pointer: every action must be reachable by Tab and activate with Enter/Space; Escape must close the topmost menu, search, or cart layer; pointer and touch targets must be at least 44×44 CSS px.
- States: hover may change contrast; focus-visible must use the focus token; active must visibly confirm activation; disabled/loading/error must announce unavailable or failed actions and preserve layout.
- Responsive and content: utility labels may collapse to icons only when an accessible name remains. Long labels must wrap or truncate without obscuring the wordmark. Empty cart/search results must include a clear next action.

### Flavor carousel and scroll chapters

- Anatomy: one selected flavor, a semantic heading, previous/next controls, progress control, and a discover cue. Flavor/profile chapters must share a single scroll position model with the scene and progress UI.
- Keyboard and pointer: arrows must work by keyboard; controls must support pointer; the progress selector must support touch and keyboard; swipe must not prevent ordinary vertical page scroll outside its horizontal interaction region.
- States: selected flavor must expose `aria-current` or `aria-pressed`; hover, focus-visible, active, disabled, loading, and error must be visibly and accessibly defined. Invalid deep-link flavors must fall back to the default flavor without a broken scene.
- Responsive and content: the mobile hero must keep the can, title, selector, and scroll cue inside separate safe zones. Flavor names must wrap without colliding with product artwork. On short landscape screens, the chapter must gain vertical space rather than clipping or overlapping the next chapter.
- Motion: transforms and opacity should drive transitions. Reduced-motion mode must use immediate or shortened transitions. The 3D canvas must have a DOM/poster fallback.

### Product imagery and product detail

- Anatomy: high-resolution can image or 3D stage, flavor name, factual description, price, pack choices, quantity, add-to-cart action, and details sections.
- Keyboard and pointer: pack options must be a semantic radio group navigable by arrow keys; image rotation must work with pointer drag and must not trap touch scrolling; recenter and view-angle controls must be buttons.
- States: selected pack/quantity must be programmatically exposed; hover/focus/active styles must remain distinguishable; out-of-stock/disabled, loading, and purchase error states must state what happened and what the user can do next.
- Responsive and content: image and text must have non-overlapping regions. Images must use intrinsic aspect ratio and an appropriate high-resolution source. Long descriptions and nutrition/ingredient lists must wrap; accordions must announce expanded state. Missing images must show the product fallback and useful alt text.

### Shop filters, collection cards, and cart actions

- Anatomy: collection introduction, filter group, featured product stage, product cards, pack selector, price, and explicit add/detail actions.
- Keyboard and pointer: filters must use either tabs with full arrow-key behavior or ordinary buttons with pressed state; pack selectors must follow radio keyboard behavior. Cards must not require clicking a non-semantic article: nested controls and a semantic detail link must remain independently operable.
- States: active filter, selected pack, add pending, success, unavailable, and error must be visually distinct and announced. Disabled/loading/error styles must preserve card dimensions.
- Responsive and content: desktop collection must use a balanced grid; mobile may use a horizontally scrollable shelf only when it has visible affordance, snap points, and keyboard reachability. Card names, prices, and buttons must wrap without clipping. Filters that produce no products must show an empty message and a reset action.

### Forms, newsletter, and footer

- Anatomy: persistent label, input, submit action, inline validation, status feedback, and footer navigation.
- Keyboard and pointer: labels must be associated with inputs; Enter submits valid forms; links and buttons must remain distinguishable and have 44px touch targets.
- States: default, hover, focus-visible, active, disabled, loading, invalid/error, and success must be styled; status changes must use an appropriate live region.
- Responsive and content: fields must fill the available mobile width; long email/error text must wrap; empty submission and service failure must have explicit messages; the footer must stack links without horizontal overflow.

## Accessibility requirements and testable acceptance criteria

- The experience must meet WCAG 2.2 AA. Text and interactive UI must meet the applicable contrast ratios: 4.5:1 for normal text, 3:1 for large text and essential UI boundaries.
- Every interactive element must be keyboard reachable, have a visible focus indicator, and expose a descriptive accessible name and state. A keyboard-only pass must reach every route, selector, overlay, filter, pack choice, and purchase action without a trap.
- Pointer and touch targets must meet 44×44 CSS px; drag controls must also provide keyboard-accessible alternatives.
- Page structure must use a logical heading hierarchy, landmarks, labels, alt text for meaningful product renders, and empty alt text for decorative imagery. Screen-reader inspection must confirm selected flavor, pack, filter, expanded accordion, cart state, and form status.
- At 390×844 and 570×320, a visual pass must confirm no content overlap, hidden focus, clipped text, or horizontal page overflow. At 200% zoom, controls and text must remain available without loss of function.
- `prefers-reduced-motion: reduce` must disable nonessential movement and preserve all information and controls.

## Content and tone standards

Copy must be concise, confident, factual, and implementation-focused. Actions must use descriptive labels such as “Explorer le produit” and “Ajouter au panier”; ambiguous labels such as “OK” or unlabeled icon-only controls are prohibited. Product and nutrition statements must match approved product data. Flavor names must use the same spelling across carousel, shop, product detail, and cart.

## Anti-patterns and migration notes

- Must not place fixed WebGL product art over readable content or commerce controls.
- Must not use scroll-distance constants that assume fixed section heights; scroll animation and chapter UI must use the same measured section checkpoints.
- Carousel, pointer, product-viewer, and scroll-stage damping must be time-based so motion speed remains consistent across refresh rates.
- Must not communicate selected, disabled, success, or error state through color alone.
- Must not remove focus outlines, use low-contrast muted text, or hide visible controls from assistive technology.
- Must not use decorative glass panels around every section, one-off token exceptions, blocking autoplay audio, or motion that ignores reduced-motion preferences.
- The existing shared Three.js renderer remains the single live product scene. During the home hero only, a high-resolution selected-can render replaces the central live can while the surrounding 3D carousel remains active; this preserves the crisp label at normal viewing size. The six 2160 × 3840 transparent product renders are the DOM fallback, range artwork, and shop/editorial artwork. The scroll refactor must retain the existing GSAP timeline and map actual section positions into its authored progress. Migration must not add a second renderer or duplicate product data.

## QA checklist

- [ ] Verify token use and type hierarchy on home, shop, product detail, overlays, and footer.
- [ ] Review desktop, 390×844 portrait, and 570×320 landscape; confirm content hierarchy, safe spacing, and no horizontal overflow.
- [ ] Confirm flavor, scroll chapter, scene, and progress HUD remain synchronized after resize, hash navigation, and content reflow.
- [ ] Check every component state, including loading, empty, disabled, and error outcomes.
- [ ] Complete keyboard-only and screen-reader checks; verify visible focus, names, roles, and state announcements.
- [ ] Check contrast and 200% zoom; verify reduced-motion behavior.
- [ ] Confirm product imagery has sharp fallback sources and useful alt text; inspect cart and form success/error feedback.
