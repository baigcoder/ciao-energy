<div align="center">

# GRIZZLY ENERGY

### *Fuel your wild side.*

**A real-time 3D product website for Grizzly Energy, a halal energy drink made in Pakistan.**
You hold the can, crack it open, watch it frost over and melt, and walk through the whole flavor range in one continuous WebGL scene.

![Hero: a fan of six flavors in a lit studio](.github/readme/hero.jpg)

`React 18` · `Three.js r161` · `GSAP` · `Lenis` · `Vite` · `TypeScript` · `Playwright`

</div>

---

## Contents

- [The experience](#the-experience)
- [Interactions](#interactions)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Content and brand data](#content-and-brand-data)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Commerce](#commerce)
- [SEO and answer engines](#seo-and-answer-engines)
- [Testing](#testing)
- [Deployment](#deployment)
- [Conventions](#conventions)

---

## The experience

The home page is a single scroll-driven film. A pinned WebGL canvas sits behind the DOM, and every section is a waypoint on one GSAP master timeline that moves the camera, the cans, the lighting and the stage.

| # | Section | What happens |
|---|---------|--------------|
| 01 | **Hero** | A symmetric fan of 12 cans (two of each flavor) in a grey studio with an overhead spotlight and a flavor-tinted halo. The centre can is sharp; the cans behind it fall softly out of focus. |
| 02 | **Flavor intro** | The camera swings round and the whole can floats beside the flavor story, bobbing and turning slowly. Frost creeps up the label and melts into running drops. |
| 03–06 | **Benefits** | The can turns to its side panel and lights one block at a time: natural caffeine, electrolytes, B vitamins, Zamzam water. |
| 04 | **Electrolytes** | The air turns into the drink: carbonation streams up past the can while the flavor's fruit drifts beside it. |
| 06 | **Zamzam** | The night gives way to a still pool lit from above. The can stands on the water line over its own reflection, rings spread from its base, a drop of light falls, and the halal seal is drawn line by line. |
| 07 | **Tagline** | An upright can in front of the giant headline. |
| 08 | **Finale** | Every can drops into one tight, twisting row. Above it, the grizzly from the label assembles out of thousands of drifting particles. |
| 09–10 | **FAQ and newsletter** | The camera lifts away into mountains, mist and a live sky: the moon is drawn at today's real phase, with dawn and dusk following the visitor's clock. |

<table>
<tr>
<td width="50%"><img src=".github/readme/flavor-intro.jpg" alt="Flavor intro: the whole can floating beside the copy"></td>
<td width="50%"><img src=".github/readme/electrolytes.jpg" alt="Electrolytes: bubbles and fruit around the lit label"></td>
</tr>
<tr>
<td><img src=".github/readme/zamzam.jpg" alt="Zamzam: the can standing over still, lit water"></td>
<td><img src=".github/readme/bear-swarm.jpg" alt="Finale: the bear assembling from particles above the row"></td>
</tr>
</table>

## Interactions

| Gesture | Where | Result |
|---------|-------|--------|
| **Click** the centre can, or press <kbd>O</kbd> | Hero | The lid tips toward you, the tab cracks open with a hiss, and cold mist rolls out. |
| **Press and hold** the centre can | Hero | It lifts out of the ring. Drag to turn it on both axes, then let go and it settles back. |
| **Flick** while turning | Any single-can scene | The can keeps spinning in the direction you threw it and eases to a stop. |
| **Swipe** across the ring | Hero | The ring carries on with momentum (up to three cans), then snaps to a flavor. The background floods with the new flavor's colour. |
| <kbd>←</kbd> <kbd>→</kbd> · <kbd>Shift</kbd>+<kbd>↑</kbd> <kbd>↓</kbd> | Home / product | Turn and tilt the featured can like a model viewer. |
| **Tilt** your phone | Mobile | Parallax on the can. iOS asks for permission on your first tap. |
| **Hover** | Desktop | Cans lean toward the pointer, with a soft chime per can. |
| **Pick flavors** | `/mix` | Each can arcs from the list into a 3D carton and drops into its well. The carton lights up when the pack is full. |

<table>
<tr>
<td width="50%"><img src=".github/readme/crack-open.jpg" alt="Clicking the can: the tab lifts and the lid faces the camera"></td>
<td width="50%"><img src=".github/readme/pack-carton.jpg" alt="Mix your pack: a full 6-pack carton glowing in the flavor colour"></td>
</tr>
</table>

## Quick start

Requires **Node 18+** (developed on Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:5173>. The opening sequence plays once per browser session. To skip it while developing, run `sessionStorage.setItem('grizzly_opened_v1', '1')` in the console.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with hot reload on port 5173 |
| `npm run build` | Typecheck, production build, then prerender every route to static HTML (`scripts/prerender.mjs`) |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end suite (builds and serves the site itself) |

Asset pipelines (re-run after changing their sources):

| Script | Builds |
|--------|--------|
| `node scripts/build-labels.mjs` | Can label textures (albedo, surface and normal maps) from `src/data/grizzly.json` and the label art |
| `node scripts/build-ktx2.mjs` | GPU-compressed KTX2 versions of the label textures |
| `node scripts/build-bear.mjs` | The bear art used by the roar and the finale particles |
| `node scripts/build-thumbs.mjs` | Product thumbnails |
| `node scripts/build-social.mjs` | Social share images |
| `node scripts/build-brand-assets.mjs` | Logo and brand assets |

## How it works

```
                 scroll (Lenis) ──► useHomeScroll ──► SceneManager.seekProgress(p)
                                                          │
             ┌────────────────────────────────────────────┤
             ▼                                            ▼
  GSAP master timeline                           per-frame render loop
  (SCENE_SEQUENCE → SCENE_STATES)                ├─ damped camera follow
  camera · can pose · lighting · stage           ├─ layoutCans(): hero fan / feature / finale row
                                                 ├─ moments[]: self-contained choreography
                                                 ├─ Stage: backdrop shader + foreground mist
                                                 └─ PostFx: lens focus → bloom → finish
```

- **One source of scene truth.** [`sceneStates.ts`](src/webgl/sceneStates.ts) maps each DOM section id to a pose (camera, product, lighting, stage). The master timeline is built from that list, so adding a section means adding one entry.
- **Moments.** Each signature effect is a small class in [`src/webgl/moments/`](src/webgl/moments) with `update()` and `dispose()`. A moment adjusts the frame's copy of the timeline data and never owns the loop:

  | Moment | Effect |
  |--------|--------|
  | `opening` | The first-visit lid close-up, tab crack and mist |
  | `canCrack` | Click to open the hero can |
  | `frostMelt` | Frost creeps up the label, then melts into wet beads |
  | `roar` | On the first scroll, the bear rises behind the can with a calm camera tremor |
  | `fruitField` | Fruit bursts on a flavor change |
  | `effervescence` | Bubbles and fruit around the can in the electrolytes chapter |
  | `zamzamPool` | The still pool, light shafts, ripples and the falling drop |
  | `ghostText` | Tagline type in the scene |
  | `finaleGlow` | A flavor glow behind each can in the finale row |
  | `bearSwarm` | The particle grizzly above the finale |
  | `iceDust` | Drifting ice crystals across every 3D route |
- **The can** ([`canModel.ts`](src/webgl/canModel.ts)) is a `MeshPhysicalMaterial` extended with `onBeforeCompile`. One label texture drives brushed metal and lacquered ink, plus two-scale condensation beads, running drops, frost, a benefit spotlight and a rim light.
- **The stage** ([`stage.ts`](src/webgl/stage.ts)) is a full-screen shader drawn at half resolution: a night sky with an aurora and today's moon, ridge-line mountains, fog banks, a wet mirror floor, the grey product studio and the flavor colour field. All of them blend from timeline values.
- **Reflections** come from a studio built in code ([`studioEnv.ts`](src/webgl/studioEnv.ts)), with a softbox, strip lights and a flavor-coloured gel, prefiltered with PMREM. It is rebuilt when the flavor changes.
- **Post-processing** ([`post.ts`](src/webgl/post.ts)) runs a lens-focus pass (a depth-of-field look without a depth buffer), highlight-only bloom, and a finish pass with vignette, grain and dither.
- **SSR-safe.** Browser APIs stay behind client boundaries. The 3D chunk loads only on routes that need it.

## Project structure

```
src/
├─ App.tsx                 routes, scene lifecycle, section ↔ scene wiring
├─ components/             DOM layer: hero, sections, shop, cart, checkout, pack builder, menus
├─ hooks/                  smooth scroll, scroll → timeline, model-viewer keys
├─ data/
│  ├─ grizzly.json         ★ single source of truth: brand, label, benefits, flavors, commerce text
│  ├─ flavors.ts · benefits.ts · products.ts · faq.ts
├─ webgl/
│  ├─ sceneManager.ts      renderer, loop, carousel, pointer, routes, quality governor
│  ├─ sceneStates.ts       section poses (the scroll story)
│  ├─ canModel.ts          can materials and shader extensions
│  ├─ stage.ts             backdrop and mist shaders
│  ├─ post.ts              lens focus, bloom, finish
│  └─ moments/             signature effects (see above)
├─ styles/                 tokens.css (design tokens) → primitives → component sheets
├─ seo/                    per-route head, JSON-LD, static page helpers
└─ audio/                  synthesised UI sound (no audio files)
scripts/                   asset pipelines and the prerenderer
tests/e2e/                 Playwright: commerce, a11y, SEO, layout, leaks, reduced motion …
public/                    textures, thumbnails, brand, social images, _headers
```

## Content and brand data

All label and site copy lives in **[`src/data/grizzly.json`](src/data/grizzly.json)**. The site and the label generator both read it, so a change there updates the page, the 3D can and the structured data together:

```bash
node scripts/build-labels.mjs && node scripts/build-social.mjs
```

> **Unconfirmed facts stay visible as placeholders.** Any value starting with `TODO` (caffeine, sugar, halal certifier and licence, Zamzam source, prices, delivery, contact details, stores, production domain) shows as a clearly marked placeholder on the site and is never published as a claim. Supply the real values in the JSON to replace them.

## Performance

- **Quality tiers** ([`devicePower.ts`](src/webgl/devicePower.ts)):
  - `HIGH` gets full materials, bloom, lens focus, floor reflections and up to 2× pixel ratio.
  - `MEDIUM` drops bloom and uses a lighter stage.
  - `LOW` drops post-processing and reflections.

  Only a known weakness (data saver, ≤ 2 GB memory, ≤ 2 cores) pushes a device down a tier.
- **Frame-rate governor.** If the scene can't hold about 50 fps, it steps down the pixel ratio, then bloom, then the tier. It never steps back up within a visit.
- **Textures stream by need.** Every can starts at 1k. The focused can gets 2k, and 4k only in close-ups on capable high-density screens, never on phones or with data saver on.
- **Deferred setup.** Post-processing, reflections and the secondary moments are built after the first frame, one idle task at a time.
- **GPU-side animation.** Bubbles, particles and ripples animate in shaders. The render loop does no per-frame allocation, and every geometry, material, texture and render target is disposed.
- **Plain pages** (shop, bag, checkout) render the backdrop at 30 fps (15 fps with reduced motion), and phones skip the 3D scene on those pages.

## Accessibility

- **`prefers-reduced-motion`** is respected everywhere: no opening, no spin, fling, drift or tremor. The frost, mist and bear appear in a still state.
- Every effect is decorative. The facts exist as real text, and the canvas carries a text alternative.
- Keyboard model viewer: arrows turn the can, <kbd>O</kbd> opens it, and focus inside fields, sliders and dialogs is never hijacked.
- 44 px touch targets, visible focus, and an axe audit of every home section in CI.
- English and Urdu (RTL) interface strings in [`src/locale.ts`](src/locale.ts).

## Commerce

Shop, product pages, bag, a mix-your-own pack builder (6 / 12 / 24) and a checkout flow, all client-side:

- Prices are **placeholders** until confirmed in `grizzly.json`, and they're marked on screen.
- **No payment provider is connected.** Checkout validates the form and reaches a confirmation screen without charging anything.
- The bag is stored in `localStorage`. Tampered storage cannot change prices, because prices are always re-read from the data.

![Mobile: pack carton and hero](.github/readme/mobile.jpg)

## SEO and answer engines

Every route is prerendered to static HTML, with its own title, description, canonical URL, Open Graph image and JSON-LD (`WebSite`, `Organization`, `Product`, `ItemList`, `BreadcrumbList`, `FAQPage`). The build also writes `robots.txt`, `sitemap.xml` and `llms.txt`. The home page stays crawlable without JavaScript: its `h1`, answer paragraph, range links and FAQ are all in the HTML.

## Testing

```bash
npm run typecheck && npm run lint && npm test
```

```bash
npm run test:e2e
```

The Playwright suite covers commerce state (shipping maths, undo, promo codes, tampered storage), accessibility (axe on every section, keyboard, focus), SEO and AEO contracts per route, layout (no horizontal overflow at 320 px), the loader lifecycle, listener and memory leaks, reduced motion, the no-WebGL fallback and the security headers.

> On slower machines, run e2e with `--workers=2`. The suite reuses any server already on port 4173, so stop a stale `vite preview` after changing code.

## Deployment

`npm run build` outputs a fully static site to `dist/`. Any static host works.

[`public/_headers`](public/_headers) carries the security and cache headers: a strict CSP, COOP/CORP, `X-Frame-Options`, and a Permissions-Policy that allows only the motion sensors the tilt effect needs. Netlify and Cloudflare Pages read it as-is. On other hosts, copy the same values into the host config. Add HSTS once HTTPS is live on the final domain.

## Conventions

- **Design tokens only.** Colours, spacing, motion and sizes come from [`tokens.css`](src/styles/tokens.css) (CSS) and [`palette.ts`](src/webgl/palette.ts) (WebGL). Components never hard-code a colour.
- **Animate transforms and opacity**, keep animation state in refs outside React renders, and guard every browser API for SSR.
- **Every effect documents its contract** in its header comment: trigger, what persists, what is scroll / pointer / time driven, what is WebGL vs DOM, what is optional, and the fallback.
- Read [`AGENTS.md`](AGENTS.md), [`DESIGN.md`](DESIGN.md) and [`RULES.md`](RULES.md) before changing the experience.

---

<div align="center">

**GRIZZLY ENERGY** · Made in Pakistan · Halal

</div>
