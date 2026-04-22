# Mobile Nav + Safe Area Design

**Date:** 2026-04-21  
**Status:** Approved

## Overview

Three improvements for the mobile experience of Finntrack:
1. Safe area support for iPhone notch / Dynamic Island
2. Replace horizontal-scrolling bottom nav with tab bar + "Más" bottom sheet
3. General responsive fixes

---

## 1. Safe Area (iOS / Dynamic Island)

### Problem

- `height: 100vh` ignores the Dynamic Island / notch area
- Topbar has no top padding on mobile — content clips under the status bar
- Toast appears too close to the home indicator
- Modal can appear behind the notch

### Solution

**`index.html`** — Add `viewport-fit=cover` to the meta viewport tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

**`globals.css`** — Replace `100vh` with `100dvh` in `.layout`. Add safe-area-aware padding in the mobile media query:

- Topbar: `padding-top: env(safe-area-inset-top)` on mobile
- Toast: `bottom: calc(1.5rem + env(safe-area-inset-bottom))`
- Modal overlay: `padding-top: env(safe-area-inset-top)`
- `.page-scroll` bottom padding already uses `env(safe-area-inset-bottom)` — verify it still works after enabling `viewport-fit=cover`

---

## 2. Mobile Menu — Tab Bar + "Más" Bottom Sheet

### Current State

`BottomNav.tsx` renders 10 items in a horizontally scrollable container. The UX is poor — items are hidden off-screen and there's no visual indication of overflow.

### New Design

**Tab bar — 4 fixed items:**

| Position | Page | Icon |
|----------|------|------|
| 1 | Inicio (dashboard) | Grid |
| 2 | Cuentas | Card |
| 3 | Gastos | List |
| 4 | Más ··· | Ellipsis / grid dots |

The active tab is highlighted with the accent color and a top border indicator.

**"Más" bottom sheet:**

Triggered by tapping the 4th tab. A modal bottom sheet slides up from the bottom with:

- Drag handle at top
- Semi-transparent backdrop (closes on tap)
- Two sections with 3-column icon grid:
  - **Dinero:** Presupuestos, Metas de ahorro, Deudas
  - **Herramientas:** Transferencias, Recurrentes, Compras a cuotas, Reporte mensual
- Items use same icon + label style as the tab bar
- Active item in the sheet is highlighted with accent color

**Behavior:**
- Tapping any item in the sheet navigates and closes the sheet
- If the current page is one of the "Más" items, the 4th tab shows as active
- Sheet can be dismissed by tapping the backdrop or dragging down

### Files to Change

- `src/components/layout/BottomNav.tsx` — full rewrite
- `src/styles/globals.css` — new `.more-sheet` styles, update `.bottom-nav` styles

---

## 3. Responsiveness Fixes

- Topbar: reduce padding on very small screens (`< 375px`)
- Ensure page content never clips under the bottom nav (bottom padding accounts for tab bar height + safe area)
- `100dvh` fixes layout height on mobile browsers where the address bar hides/shows

---

## Out of Scope

- Sidebar changes (desktop only)
- Any page content layout changes beyond what the CSS grid breakpoints already handle
- Animations/gesture-based sheet dismissal (drag-to-close)
