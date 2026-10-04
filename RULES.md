# CIAO ENERGY RECREATION — AUTHORITY RULES

## Authority
This document is the highest-priority project authority.

Authority order:
1. RULES.md
2. AGENTS.md
3. PRD.md
4. ARCHITECTUE.md
5. DESIGN.md
6. TASKS.md
7. MEMORY.md
8. ANTIGRAVITY_PROMPT.md

If two documents conflict, obey the higher-priority document and report the conflict. Never silently invent a resolution.

## Core Objective
Build a pixel-close, high-performance recreation of the supplied Ciao Energy reference experience for learning/prototyping. Reproduce the interaction model, composition, motion language, 3D storytelling, navigation behavior, and responsive structure while using only assets/content the project is licensed to use.

## Non-negotiables
- MUST treat the supplied screenshots and the live reference URL as visual references.
- MUST preserve semantic HTML and keyboard accessibility.
- MUST provide a non-WebGL fallback.
- MUST respect `prefers-reduced-motion`.
- MUST keep all essential text in HTML, not inside WebGL.
- MUST keep the public experience performant under sustained scrolling.
- MUST avoid blocking the main thread with large synchronous asset work.
- MUST preload only first-viewport essentials.
- MUST lazy-load secondary 3D scenes, textures, and media.
- MUST clean up WebGL resources and event listeners.
- MUST avoid scroll hijacking that breaks native browser expectations.
- MUST not fabricate product claims or brand content.
- MUST document any reference behavior that cannot be legally or technically reproduced.
- MUST not introduce arbitrary one-off tokens or component-specific magic numbers.
- MUST use semantic design tokens rather than raw values inside component guidance.
- MUST define default, hover, focus-visible, active, disabled, loading, and error states for every interactive component.
- MUST make all controls usable with pointer, keyboard, and touch.
- MUST keep touch targets at least 44×44px; 48×48px is preferred for primary controls.
- MUST keep sound opt-in; no autoplay audio with sound.
- MUST gracefully handle WebGL unavailable, low-memory devices, blocked assets, slow networks, and reduced-motion mode.

## Visual Fidelity
The target is structural/pixel-close recreation, not a vague "inspired by" page.
Reproduce:
- black/dark canvas
- top utility controls
- centered brand/navigation treatment
- immersive 3D can field
- scroll-driven product transitions
- large editorial product typography
- vertical product/benefit navigation
- thin framing marks and instrumentation
- controlled gradients/lighting
- restrained loading experience
- high-contrast minimalist controls

Do not:
- turn the design into a generic SaaS dashboard
- substitute generic cards for the 3D storytelling
- add unnecessary glassmorphism
- add gradients merely for decoration
- use a template-like hero
- use random particle effects
- overload the page with UI chrome

## Technical Integrity
MUST prefer progressive enhancement:
HTML/CSS first → enhanced interaction → WebGL.

MUST define explicit state machines for:
- app bootstrap
- asset loading
- current flavor/section
- audio state
- WebGL readiness
- reduced motion
- mobile capability

## Legal / Brand Boundary
This repository is a recreation/prototyping exercise. For a public deployment, only use Ciao Energy trademarks, logos, product renders, copy, textures, or other proprietary assets with permission/licensing. Keep a clear distinction between reference-derived visual behavior and project-owned implementation/assets.
