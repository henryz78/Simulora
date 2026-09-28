# PX-3 Paper Gallery Restyle: Implementation Report

**Date:** 2026-09-28 · **Decision:** the owner asked to restyle the web app as
close as possible to a reference site they chose (galerra.art): layout,
palette, type, fonts, hover and press feel, motion. The owner asked Claude to
do it directly. · **Approved SHA:** `149a735` · **Evidence:** exact-SHA CI
`36488678854` success (verified by the owner) · **Review:** independent
Reviewer (Sonnet 5) `PASS` (0B/0I/0M) after two rounds of fixes.
**PX-3 CLOSED.**

## 1. Commits

| Commit | Kind | What | CI |
|---|---|---|---|
| `e328615` | behavior | Restyle, self-hosted fonts, new home layout | `36485624052` failure (CSP) |
| `e01a52d` | behavior | CSP font fix and first review fixes | `36488511964` success |
| `149a735` | behavior | Second review fixes | `36488678854` success |

## 2. What changed

- **Style.** Warm paper `#f6f3ec`, ink `#1a1917`, one red signal `#b8371f`
  used only for "this needs you" (a 6px dot, the pending label, the focus
  ring). Instrument Serif for headlines and the world's voice (italic), Sofia
  Sans for the interface.
- **Controls.** 44px buttons with 4px corners: ink primary, outlined
  secondary, underlined links. 120ms colour changes on hover and press, an
  arrow that nudges 2px on hover, a sticky blurred top bar that gains a
  hairline once the page scrolls.
- **Motion.** Sections rise 10px into place on load, 70ms apart. Movement
  only; the reference also fades, but a fade lowers text contrast while it
  runs and would fail the axe check. Reduced motion stops all of it.
- **Home page.** A hero with the latest world hung in a frame, gallery grids
  for "Continue playing" and "Your worlds", and three steps into World Studio.
- **Play and other pages.** Same markup, restyled: the current situation as a
  serif headline, story entries in italic serif numbered "No. 01", cards only
  for objects the player acts on.
- **Fonts.** `@fontsource/instrument-serif` and
  `@fontsource-variable/sofia-sans` (OFL), bundled as same-origin files. The
  production CSP (`default-src 'self'`) forbids Google Fonts and `data:`
  fonts, so Vite never inlines a font.
- **A general design system** of the same style, "Paper Gallery", is kept as a
  claude.ai Design System artifact owned by the owner; it names no product.

No route, role, label, API, domain or SQL change. The reference site's name,
marks, copy and images are not used.

## 3. Evidence

- CI `36485624052` on `e328615` failed the CSP render check: Vite had inlined
  the 3.4 kB Cyrillic-Extended Sofia Sans file as `data:`. Fixed in
  `e01a52d`; `pnpm web:csp` against the built app under the production CSP
  passes, and fails again without the fix.
- Locally: Playwright desktop, 390×844 and tablet 150/150 (including the axe,
  320px reflow, reduced-motion and focus checks); typecheck and ESLint clean.
- CI `36488678854` on `149a735`: every job passed, including Firefox and
  WebKit, which were not run locally.

## 4. Independent Review

| Round | Target | Verdict | Findings and resolution |
|---|---|---|---|
| 1 | `e328615` | `PASS WITH ISSUES` (0B/2I/8M) | I-1 anchor hidden under the sticky bar; I-2 inlined font under the CSP (same as CI); minors: status borders, unavailable ribbon, danger text buttons, disabled hover, reduced-motion delays, phone bar width, field border contrast, dates without year, list semantics. All fixed in `e01a52d`. |
| 2 | `e01a52d` | `PASS WITH ISSUES` (0B/1I/1M) | I-1 still hidden on phones (the home bar stays sticky there); a disabled delete button turned black on hover. Fixed in `149a735`. |
| 3 | `149a735` | `PASS` (0B/0I/0M) | Anchor re-measured at 390px and 1280px, clear of the bar. |

Accepted as is: the step numerals are decorative large text in the faint
colour.

## 5. Not claimed

- Human enjoyment or a usability study of the new look.
- Pixel parity with the reference site; the fade in its load motion is
  deliberately left out.
- The `frontend-design` branch proposals are superseded, not merged.
