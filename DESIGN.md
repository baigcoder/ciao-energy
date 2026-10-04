# CIAO ENERGY — IMPLEMENTATION DESIGN SYSTEM

## 1. Design Intent
Create a minimalist black product theatre where the 3D object, scroll, typography, lighting, and sparse controls behave as one composition.

## 2. Foundations

### Color Tokens
Use semantic tokens:
```css
--color-canvas: #000000;
--color-text-primary: #ffffff;
--color-text-muted: rgba(255,255,255,.64);
--color-line: rgba(255,255,255,.18);
--color-line-strong: #71bd96;
--color-success: #71bd96;
--color-accent: #71bd96;
--color-error: #ff6b6b;
```

Flavor-specific colors should be data-driven CSS variables rather than hardcoded per component.

### Typography
Primary:
Geist, Arial, sans-serif

Mono:
Geist Mono, monospace

Use a small set of fluid sizes:
```css
--type-display: clamp(4.5rem, 11vw, 8.75rem);
--type-section: clamp(2.25rem, 5vw, 4.5rem);
--type-body: clamp(1rem, 1.15vw, 1.35rem);
--type-label: .72rem;
```

The headline may use a bold/black display style, while body copy remains light.

### Spacing
Use a consistent spacing scale. Do not create local arbitrary values.
Recommended:
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.

## 3. Reference Composition

### Screen 1 — Loader
- full black
- centered brand
- small progress value
- no distracting secondary UI

### Screen 2 — Product Theatre
- black-to-soft-gradient atmosphere
- central floating can
- top brand
- utility controls
- minimal side navigation
- thin corner/technical framing

### Screen 3 — Product Detail
- can shifts in perspective
- title moves to a controlled editorial zone
- body copy is short
- 3D remains dominant

### Screen 4 — Benefit Comparison
- explicit ingredient comparison
- compact before/after labels
- object and background state reinforce the message

### Screen 5 — FAQ
- large editorial title
- accordion rows
- generous whitespace
- minimal borders

### Screen 6 — Newsletter/Footer
- clear conversion
- concise copy
- simple input and action
- legal/privacy text

## 4. Navigation
Desktop:
- left: sound/status
- center: brand
- right: menu + contact
- active controls use restrained state changes

Mobile:
- compact top bar
- accessible drawer
- no accidental horizontal scroll

## 5. 3D Art Direction
The can is the protagonist.

Lighting:
- black environment
- controlled key/rim light
- subtle HDRI reflections if available
- soft ground/fill where needed

Material:
- realistic metal
- controlled roughness
- accurate texture mapping
- subtle reflections

Composition:
- product can occupy a large percentage of viewport
- avoid tiny product render inside a huge empty canvas
- maintain clear text safe zones
- use camera perspective intentionally

Transitions:
- rotation
- position
- scale
- depth
- lighting
- atmosphere

All are tied to the master scroll timeline.

## 6. Motion Tokens
```css
--motion-fast: 180ms;
--motion-standard: 400ms;
--motion-slow: 900ms;
--motion-cinematic: 1400ms;
```

Use ease curves intentionally.
For physics-like product transitions, use damped interpolation rather than arbitrary CSS timing.

## 7. Sound
Sound is optional.
States:
- OFF
- ON
- LOADING
- BLOCKED
- ERROR

Autoplay with audio is prohibited.
Visual state must remain understandable without sound.

## 8. Components

### `CiaoHeader`
States:
default / scrolled / menu-open / focus-visible / disabled

### `FlavorRail`
States:
default / hover / focus / active / disabled

### `ProductScene`
States:
loading / ready / fallback / error / reduced-motion

### `BenefitContrast`
States:
default / active / transition

### `FaqAccordion`
States:
closed / open / focus-visible / disabled / error

### `NewsletterForm`
States:
default / focus / submitting / success / validation-error / server-error

### `Preloader`
States:
initial / loading / ready / degraded / error

## 9. Accessibility
MUST:
- preserve visible focus
- use button/link semantics
- expose active flavor to assistive tech
- make accordion buttons descriptive
- provide iframe/image alternatives if used
- avoid motion-only meaning
- maintain contrast
- provide reduced-motion behavior

## 10. Density
The supplied extraction reports:
- links: 19
- buttons: 17
- inputs: 4

Treat these as planning references, not a reason to create unnecessary controls.
The final implementation should remain sparse and intentional.

## 11. Anti-Patterns
Do not:
- replace 3D storytelling with a card grid
- create a hero made only of text
- animate entire DOM trees on scroll
- use giant fixed canvases on mobile
- block content until every asset loads
- hide copy inside canvas
- use tiny touch targets
- introduce one-off spacing values
- overuse rounded rectangles
- create a generic WebGL particle background

## 12. QA
MUST visually inspect:
375, 390, 430, 768, 1024, 1280, 1440, 1920 widths.

MUST validate:
keyboard
reduced motion
WebGL fallback
slow network
resize
orientation
tab visibility
long FAQ answers
invalid email
newsletter server failure
missing 3D asset
