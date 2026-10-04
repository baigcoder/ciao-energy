# CIAO ENERGY RECREATION — ACCESSIBILITY REPORT (WCAG 2.2 AA)

## 1. Compliance Audit

### 1.1 Semantic Structure & Landmark Roles
- `<header role="banner">`: Contains status controls, brand logo, and navigation toggles.
- `<main className="page-container">`: Houses all product storytelling, detail sections, comparative benefits, and FAQ content.
- `<footer role="contentinfo">`: Contains newsletter conversion, community links, and legal mentions.
- Semantic Headings: Hidden `<h1>` ("Ciao Energy – L'energy drink parfaite"), sequential `<h2>` elements for each major section, `<h3>` where appropriate. Zero heading level skipping.

### 1.2 Keyboard Navigation & Focus Management
- All interactive controls (buttons, links, sliders, accordion triggers, form inputs) are 100% reachable and operable via keyboard:
  - `Tab` / `Shift+Tab`: Natural logical focus sequence.
  - `ArrowLeft` / `ArrowRight`: Step through flavors in the hero carousel.
  - `Enter` / `Space`: Toggle accordion items, activate buttons, trigger links.
  - `Escape`: Closes the menu drawer and returns focus to the `.navbar_menu-button`.
- Obvious `:focus-visible` outline: `outline: 2px solid var(--color-line-strong); outline-offset: 3px;`.

### 1.3 ARIA Roles & Screen Reader Annotations
- **Hero Carousel**: `role="region"`, `aria-roledescription="carousel"`, previous and next buttons labeled.
- **Liquid Slider**: `role="slider"`, `aria-label="Sélecteur de saveur Ciao Energy"`, `aria-valuemin="1"`, `aria-valuemax="6"`, `aria-valuenow`, `aria-valuetext`.
- **Menu Drawer**: `role="dialog"`, `aria-modal="true"`, `aria-label="Menu principal"`.
- **FAQ Accordion**: `aria-expanded="true/false"`, `aria-controls`, `role="region"` for answer panels.
- **Audio Control**: `aria-pressed="true/false"`, accessible status label.
- **Strikethrough Pills**: `aria-label="Ancien standard remplacé: [Label]"`.
- **Newsletter**: Form labeled with `<label htmlFor="EMAIL">`, `aria-live="assertive"` for submission feedback.

### 1.4 Non-WebGL Information Parity
- No essential information is trapped inside WebGL canvas. All product titles, flavor descriptions, benefit comparisons, FAQ answers, and legal text reside in semantic HTML DOM.

### 1.5 Reduced Motion Handling
- `@media (prefers-reduced-motion: reduce)` disables non-essential animations, camera swings, and transitions, providing a calm, accessible static presentation without information loss.
