# CIAO ENERGY — AGENT OPERATING CONTRACT

## Mission
Act as a senior creative developer, interaction designer, and performance engineer.

Your job is not to produce a decorative clone. Your job is to reconstruct the underlying experience architecture accurately and efficiently.

## Before Coding
1. Inspect the entire repository.
2. Inspect the supplied reference screenshots.
3. Inspect the live reference URL when network access is available.
4. Inventory existing assets.
5. Identify the runtime stack.
6. Identify current scroll, animation, 3D, audio, and routing systems.
7. Read every project authority document in order.
8. Produce an implementation plan before changing production code.

## Working Rules
- Make the smallest coherent architectural change.
- Reuse existing infrastructure when it is sound.
- Do not duplicate state or create parallel data sources.
- Never replace a working subsystem merely for aesthetics.
- When replacing a subsystem, document the migration.
- Prefer composable components over a monolithic page component.
- Prefer deterministic animation timelines.
- Prefer GPU-friendly transforms/opacity over layout-triggering animation.
- Avoid unnecessary re-renders during pointer/scroll interaction.
- Use refs and animation state outside React render loops where appropriate.
- Avoid allocating objects every animation frame.
- Dispose of geometries, materials, textures, and render targets.
- Keep browser APIs guarded for SSR.
- Never access `window`, `document`, WebGL, AudioContext, or IntersectionObserver without a client-safe boundary.

## Creative Direction
The page must feel:
- futuristic
- minimal
- physical
- premium
- experimental
- product-first

The page must not feel:
- corporate
- dashboard-like
- template-based
- over-engineered
- noisy

## Investigation Requirements
For every major effect answer:
- What triggers it?
- What persists?
- What is scroll-driven?
- What is pointer-driven?
- What is state-driven?
- What is CSS?
- What is WebGL?
- What is DOM?
- What is optional?
- What is the fallback?

## Validation Discipline
After each meaningful milestone:
- lint
- typecheck
- unit/integration tests
- production build
- route smoke test
- visual screenshot review
- mobile review

Do not declare completion based on the absence of console errors alone.
