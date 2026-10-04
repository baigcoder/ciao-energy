# ANTIGRAVITY — MASTER EXECUTION PROMPT
# CIAO ENERGY PIXEL-CLOSE RECREATION / HIGH-PERFORMANCE WEBGL EXPERIENCE

YOU ARE WORKING ON A CREATIVE DEVELOPMENT RECONSTRUCTION.

Your goal is to build a pixel-close recreation of the supplied Ciao Energy reference experience, preserving its underlying interaction language and product-theatre feeling while implementing the system cleanly, accessibly, and efficiently.

DO NOT begin by coding.

FIRST AUDIT.
THEN ARCHITECT.
THEN IMPLEMENT.
THEN VISUAL QA.
THEN PERFORMANCE QA.

============================================================
AUTHORITY ORDER
============================================================

1. RULES.md
2. AGENTS.md
3. PRD.md
4. ARCHITECTUE.md
5. DESIGN.md
6. TASKS.md
7. MEMORY.md
8. ANTIGRAVITY_PROMPT.md

Higher priority always wins.

If a conflict exists:
- report it
- identify the higher-priority rule
- do not silently invent a resolution

============================================================
REFERENCE SOURCES
============================================================

Use BOTH:

A. supplied screenshots
B. live reference URL:
https://www.ciaoenergy.com/

Study visual behavior, not only static appearance.

Inspect:
- loading
- navigation
- scrolling
- 3D object behavior
- flavor selection
- color/lighting transitions
- typography
- benefit transitions
- menu
- FAQ
- newsletter
- responsive behavior

============================================================
PHASE 0 — REFERENCE AUDIT
============================================================

Before touching production code create:

docs/REFERENCE_ANALYSIS.md
docs/INTERACTION_MAP.md
docs/ASSET_REQUIREMENTS.md
docs/PERFORMANCE_MODEL.md

For each reference section document:

SECTION
PURPOSE
DOM COMPOSITION
3D COMPOSITION
SCROLL RANGE
TRIGGER
MOTION
COLOR
TYPOGRAPHY
RESPONSIVE BEHAVIOR
ACCESSIBILITY
PERFORMANCE COST
FALLBACK

Do not code until this inventory exists.

============================================================
PHASE 1 — VISUAL FORENSICS
============================================================

Analyze the supplied screenshots at implementation scale.

Measure approximately:
- viewport margins
- header height
- control positions
- hero object size
- safe text zones
- vertical/horizontal rhythm
- line weights
- typography scale
- nav alignment
- active indicators
- product crop
- background gradient location

Do not chase meaningless 1px differences before the composition is correct.

Priority:

1. composition
2. scale
3. spacing
4. typography
5. 3D placement
6. lighting
7. micro-details

============================================================
PHASE 2 — CORE EXPERIENCE
============================================================

Build a full-screen product theatre.

Initial viewport:

BLACK
↓
CENTER BRAND
↓
3D PRODUCT FIELD
↓
MINIMAL UTILITY UI

Use a persistent scene.

The 3D can is the primary visual object.

The DOM provides:
- title
- description
- controls
- flavor labels
- status

============================================================
PHASE 3 — PRELOADER
============================================================

Implement:

LOADING
0 → 100%

But loading must mean:
FIRST VIEW READY

Do NOT wait for:
- every flavor texture
- every FAQ asset
- optional audio
- secondary media

Load secondary resources progressively.

If a critical asset fails:
show degraded mode and continue.

============================================================
PHASE 4 — THREE.JS SYSTEM
============================================================

Use one persistent renderer.

Scene:

camera
lights
environment
can
optional base/platform
optional background geometry

Use realistic PBR materials.

Target:
premium physical product render.

Optimize:
- GLB
- textures
- environment
- draw calls
- DPR
- postprocessing

Do not create multiple WebGL canvases for sections.

============================================================
PHASE 5 — SCROLL SYNCHRONIZATION
============================================================

Create ONE master progress value:

0.0 → 1.0

Use it to drive:

camera
can position
can rotation
can scale
background
active flavor
DOM copy
benefit transition

Do not create ten independent scroll listeners.

Prefer:

scroll
→ progress
→ timeline
→ scene + DOM

Use GSAP/ScrollTrigger or an equivalent deterministic timeline.

If using Lenis:
ensure synchronization is stable and avoid double-smoothing.

============================================================
PHASE 6 — FLAVOR SYSTEM
============================================================

Implement six data-driven flavors:

01 Double Litchi
02 Coco Citron Vert
03 Kiwi Concombre
04 Pêche Blanche
05 Pomme Rhubarbe
06 Abricot Framboise

Each flavor has:

id
name
shortName
description
theme
asset reference
scene transform
section index

Never duplicate flavor-specific components.

One shared component.
Different data.

============================================================
PHASE 7 — FLAVOR TRANSITION
============================================================

When progressing between flavors:

A.
current can moves/rotates

B.
new can state interpolates

C.
background color/lighting changes

D.
title/copy transitions

E.
active navigation updates

Transitions must feel physical.

Avoid hard cuts.

Use:

opacity
transform
rotation
camera
light
color

Do NOT animate layout properties when unnecessary.

============================================================
PHASE 8 — PRODUCT TYPOGRAPHY
============================================================

Typography must remain highly legible.

Main display:
very large.

Secondary:
clean sans.

Technical labels:
compact mono/uppercase where appropriate.

Keep text outside WebGL.

Long product descriptions must wrap naturally.

No clipping.

No text-over-3D collisions.

============================================================
PHASE 9 — PRODUCT NAVIGATION
============================================================

Create a subtle flavor rail.

Desktop:
vertical/right-side or equivalent inspired by reference.

Mobile:
compact bottom or side control.

Controls must:
- have accessible labels
- show active state
- support keyboard
- support touch
- not interfere with scroll

============================================================
PHASE 10 — BENEFITS
============================================================

Recreate the comparative storytelling style.

For each verified benefit show:

OLD / PREVIOUS CHOICE
↓
NEW / CIAO CHOICE

Examples from the current reference structure:
- reduced sugar
- natural flavors
- coffee-derived caffeine
- stevia

Do not invent additional claims.

Use the 3D product and lighting as visual reinforcement.

============================================================
PHASE 11 — MENU
============================================================

Minimal overlay menu.

Requirements:
- full keyboard accessibility
- focus trap while open
- Escape closes
- returns focus to trigger
- backdrop click closes if appropriate
- body scroll lock while modal is open
- accessible labels

Keep it visually sparse.

============================================================
PHASE 12 — AUDIO
============================================================

Implement sound only as progressive enhancement.

Default:
OFF

After explicit user interaction:
ON

Provide visible state.

Handle:
blocked
unsupported
loading
error

No autoplay with sound.

============================================================
PHASE 13 — FAQ
============================================================

Build accessible accordion.

Keep the current reference information structure.

Do not make every FAQ item a giant card.

Use:
large question
thin divider
smooth reveal

Long answers:
wrap
do not clip
do not overflow viewport

============================================================
PHASE 14 — NEWSLETTER
============================================================

Build:
email field
submit
loading
success
validation error
server error

Do not use ambiguous labels.

Example:
"Your email address"
"Subscribe"

Privacy information must remain visible.

============================================================
PHASE 15 — FOOTER
============================================================

Keep footer minimal.

Use:
brand
legal links
privacy
terms
copyright
social/utility links where actually required

============================================================
PHASE 16 — MOBILE
============================================================

Mobile must be intentionally composed.

Do NOT create:
desktop page scaled to 375px.

At 375/390/430:
- typography remains readable
- 3D product remains visually dominant but uses reduced quality
- controls become reachable
- side navigation transforms
- menu becomes drawer/overlay
- remove expensive post-processing
- lower texture resolution
- cap DPR
- disable nonessential 3D
- provide CSS/SVG/image fallback if needed

============================================================
PHASE 17 — RESPONSIVE 3D QUALITY
============================================================

Define quality presets:

HIGH:
desktop powerful GPU

MEDIUM:
desktop modest GPU / tablet

LOW:
mobile/high memory pressure

STATIC:
WebGL unavailable/reduced motion

Quality changes:
- DPR
- shadow quality
- texture resolution
- postprocessing
- reflections
- number of secondary objects

Never remove essential product information.

============================================================
PHASE 18 — REDUCED MOTION
============================================================

When `prefers-reduced-motion: reduce`:

Disable:
- aggressive scroll-linked transforms
- automatic product rotation
- nonessential parallax
- looping effects

Retain:
- product image
- typography
- navigation
- content
- accessible transitions

============================================================
PHASE 19 — PERFORMANCE
============================================================

Performance is a first-class feature.

MUST:
- keep first viewport light
- lazy-load secondary assets
- optimize GLB
- compress textures
- cap DPR
- pause offscreen rendering
- stop rendering when tab is hidden where practical
- avoid React state updates every frame
- clean WebGL resources
- avoid multiple animation loops
- avoid unnecessary layout reads/writes
- reduce post-processing on mobile

Use profiling.

Do not claim 60fps unless measured.

============================================================
PHASE 20 — EDGE CASES
============================================================

Test:

WebGL unavailable
slow 3G
asset 404
texture 404
resize
orientation change
browser tab hidden
device pixel ratio 1/2/3
reduced motion
keyboard-only
touch-only
very narrow screens
very wide screens
long FAQ answer
newsletter invalid email
newsletter server error
audio blocked

Nothing should blank the page.

============================================================
PHASE 21 — VISUAL ACCEPTANCE
============================================================

The final experience should reproduce the supplied reference's key
visual characteristics:

- black cinematic canvas
- minimal white typography
- large physical 3D product
- scroll-driven movement
- product/flavor transitions
- sparse UI
- subtle framing
- controlled lighting
- vertical navigation
- immersive editorial presentation

Reject if it becomes:
- dashboard
- SaaS template
- bento grid
- generic 3D portfolio
- particle demo
- card-heavy marketing template

============================================================
PHASE 22 — VALIDATION
============================================================

Run:

npm run lint
npx tsc --noEmit
npm test -- --passWithNoTests
npm run build

Also perform:

keyboard audit
reduced-motion audit
responsive audit
console-error audit
network-error audit
WebGL fallback audit

Screenshots:

1440 × 900
1280 × 800
1024 × 768
768 × 1024
430 × 932
390 × 844
375 × 812

============================================================
PHASE 23 — DOCUMENTATION
============================================================

Create:

docs/REFERENCE_ANALYSIS.md
docs/INTERACTION_MAP.md
docs/ASSET_REQUIREMENTS.md
docs/PERFORMANCE_MODEL.md
docs/IMPLEMENTATION_REPORT.md

IMPLEMENTATION_REPORT.md must contain:

1. reference mapping
2. architecture
3. scene system
4. scroll system
5. flavor system
6. menu
7. benefits
8. FAQ
9. newsletter
10. responsive behavior
11. accessibility
12. performance
13. fallbacks
14. validation results
15. known limitations

============================================================
STRICT RULE
============================================================

DO NOT COPY SOURCE CODE FROM THE REFERENCE WEBSITE OR THIRD-PARTY
RECREATIONS.

REIMPLEMENT THE EXPERIENCE ARCHITECTURE.

DO NOT HOTLINK PROPRIETARY ASSETS FOR A PUBLIC DEPLOYMENT.

============================================================
FINAL RESPONSE
============================================================

When all phases are complete, return:

CIAO ENERGY RECREATION COMPLETE

Then:

1. Reference audit summary
2. Architecture summary
3. 3D summary
4. Scroll/motion summary
5. Responsive summary
6. Accessibility summary
7. Performance summary
8. Validation summary
9. Known limitations
10. Files changed
