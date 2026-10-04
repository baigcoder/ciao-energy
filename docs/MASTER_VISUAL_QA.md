# Ciao Energy — Master Visual QA (Current Pass)

**Date:** 2026-09-30

## Current checks

| State | Result | Evidence / limit |
|---|---|---|
| Home hero | Reviewed | Live in-app browser at compact 466×682; central can, three-can framing, title, progress and header visible. The product detail toggle now sits below the header on mobile instead of competing with the bottom progress HUD. |
| Full range | Reviewed after fix | Live browser scroll showed a single selected can, six flavor pills, and no repeated vertical stack. Scale increased afterward; standard desktop/mobile final framing remains NOT VERIFIED. |
| Shop | Reviewed after 4K redesign | At 466×682, the featured can is visible beside the selection copy without crossing the filters; the stale home tint is cleared on route change. Horizontal snap cards visibly use the 2160×3840 transparent renders. Desktop layout and other phone widths remain NOT VERIFIED. |
| PDP | Reviewed after mobile adjustment | Live browser reached `/product/coco-citron-vert`; the can sits below its viewer badge and clears the bottom angle controls at 466×682. The Nutrition angle visibly changes the live model. The new still fallback on an actual WebGL failure remains NOT VERIFIED. |
| Invalid product route | NOT VERIFIED | No browser pass after current metadata/not-found changes. |
| Cart/menu/search/FAQ/newsletter | NOT VERIFIED in browser during this pass | Existing unit tests cover catalog/cart logic, not these visual states. |
| Horizontal overflow at target widths | NOT VERIFIED | Current live browser is compact; no 375/390/430/768/1024/1280/1440 fresh capture matrix was made. |

## Automated validation

- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm test`: PASS, 7 tests.
- `npm run build`: PASS with Vite large-chunk warning (JS 894.73 kB raw, CSS 69.05 kB raw).
- Exact requested `npm test -- --passWithNoTests` fails because `package.json` already supplies that flag and the CLI receives it twice. The equivalent `npm test` completed successfully.

## Visual follow-up

Capture actual section states at 1440×900, 1280×800, 768×1024, and 390×844; review the full-range product scale, PDP sticky release/related section, cart, menu, search, FAQ, newsletter, and reduced-motion setting. Historical captures in `screenshots/` predate this pass and must not be reported as current evidence.
