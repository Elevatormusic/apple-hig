---
title: Web (App + Marketing Website)
platforms: [web]
value_type: profile
source_url: https://www.w3.org/TR/WCAG22/
last_verified: 2026-06-23
---

# Web Design Rubric — Apple PRINCIPLES, web-native execution (NOT iOS chrome)

Apple's HIG is scoped to Apple platforms; it does **not** govern the web. Reuse Apple's transferable
PRINCIPLES (clarity, deference, hierarchy, never-color-alone) but judge a web UI by **web** standards
(W3C/WCAG) and **web** conventions — never by iOS chrome.

## Scope binding (DO THIS FIRST)

Before grading, bind the target to exactly one profile and **name it in the verdict**:

- **PROFILE A — Web Application** — app-like SPA/PWA/SaaS: dashboards, productivity tools, editors,
  authenticated/stateful tools, data views.
- **PROFILE B — Marketing / Content Website** — content-first: landing pages, marketing sites, docs,
  blogs, brochure sites.
- **Mixed** (e.g. a marketing site with an embedded app surface): grade each surface under its own
  profile and say which is which.

**Hard rule (mis-binding is a false positive, symmetric to the iOS-chrome cardinal sin):** NEVER grade a
marketing/content site against app-state rigor (empty/loading/optimistic-UI/offline/skeletons/in-app
nav), and NEVER block an app on pure content-site SEO/LCP-hero rigor.

Always grade the **SHARED BASE** (15 dims), then **exactly one** delta block.

## Authority discipline (restate every review)

- WCAG/W3C facts → `wcag_external`. Web-platform conventions (WHATWG/MDN/web.dev/Core Web Vitals/NN-g/
  Material/Fluent/schema.org) → `community_convention`. Apple's transferable principles applied to the
  web → `inference`.
- The **only** `apple_published` web facts: (a) the SF Pro / SF Compact / SF Symbols off-Apple-platform
  license prohibition, and (b) the three official Apple web components (Apple Pay on the Web, Sign in
  with Apple JS, MapKit JS) **when actually present**.
- Contrast ratios are **W3C**, never Apple — even when an Apple page repeats them. The **cardinal sin**:
  never impose iOS/Apple chrome on the web; flag the *opposite* (iOS chrome transplanted onto web).

---

## SHARED BASE dimensions (apply to BOTH profiles)

### Base 1 — Layout & spacing  `community_convention`
PASS: consistent spacing scale (4/8px base) via tokens; body constrained to a readable measure (~45–75ch),
not full-bleed; whitespace establishes proximity/grouping; a defined responsive grid; consistent padding
across like components. FAIL: ad-hoc px margins, colliding controls, edge-to-edge text with no gutters,
inconsistent card/section padding. Apple's *deference* applies as `inference`; realize it with web layout,
NOT iOS insets/safe-areas. — https://m3.material.io/foundations/layout

### Base 2 — Typography & hierarchy  `community_convention`
PASS: clear hierarchy via size/weight/color (h1>h2>body>caption); body line length ~45–75ch; line-height
~1.4–1.6 body; `system-ui` stack or a licensed webfont; `rem`/`clamp()` fluid sizing; semantic heading
order (one h1, no skipped levels). FAIL: one-size/one-weight, walls of >100ch text, headings used for
styling not structure, px-locked body that won't scale. Hierarchy = `inference`; line-length + font stack =
`community_convention`. — https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Text_styling

### Base 3 — SF font / SF Symbols prohibition  `apple_published`
FAIL if the site ships SF Pro, SF Compact, New York, or SF Symbols glyphs as typeface/iconset off an Apple
platform (license). PASS: `system-ui` stack or a web-licensed font + an open inline-SVG icon set. This is
the ONE Apple-authoritative typography rule on the web; the substitutes are `community_convention`.
— https://developer.apple.com/fonts/

### Base 4 — Color / contrast / dark mode  `community_convention`
PASS: token-based palette with paired light+dark; honors `prefers-color-scheme`; declares `color-scheme`
so native controls + scrollbars theme; contrast holds in BOTH themes; honors `prefers-contrast`/
`forced-colors` (Windows High Contrast not broken). FAIL: dark mode absent or an inverted filter,
hardcoded hex with no dark pairing, text/controls failing contrast in one theme, forced-colors rendering
invisible controls. (Numeric ratios graded in Base 7; never-color-alone in the delta forms/feedback dims.)
— https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

### Base 5 — Components & controls (web-native)  `wcag_external`
PASS: native elements first — real `<button>` for actions, `<a href>` for navigation, native `<select>`/
`<input type>`/checkbox/radio where they fit; modals on `<dialog>` (or a fully-implemented APG dialog) with
inert background; data in `<table>` with `<th scope>`; custom widgets follow ARIA APG keyboard models.
FAIL: `<div onclick>` as button/link, link/button semantics swapped, custom dropdown with no keyboard
support, modal with no focus trap. Do NOT require iOS controls (segmented control, switch styling, picker
wheels). — https://www.w3.org/WAI/ARIA/apg/

### Base 6 — Content & writing / voice  `community_convention`
PASS: concise, specific, jargon-free labels; consistent sentence-case UI text; action labels are verbs
that say what happens; matches the user's real-world language; consistent terminology per concept. FAIL:
vague "Submit"/"OK" where a specific verb fits, inconsistent terms, internal jargon, walls of instructional
text. Carry Apple's *clarity* (`inference`); do NOT impose Apple title-case or the menu-ellipsis convention
as a web requirement. — https://www.nngroup.com/articles/ten-usability-heuristics/

### Base 7 — Accessibility · text & non-text contrast  `wcag_external`
PASS: body text ≥**4.5:1**; large text (≥18pt/24px regular or ≥14pt/18.66px bold) ≥**3:1**; placeholder/hint
≥4.5:1; UI-component boundaries, meaningful icons, focus indicators, essential chart marks ≥**3:1** (1.4.11).
FAIL: low-contrast grey labels, ghost buttons with <3:1 borders, chart series in near-identical hues, focus
ring failing 3:1. The px equivalents (24px/18.66px) are an Understanding-doc convenience gloss; the
normative thresholds are the **pt** values. W3C thresholds — never `apple_published`.
— https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

### Base 8 — Accessibility · target size & pointer  `wcag_external`
PASS: pointer/touch targets ≥**24×24 CSS px** (2.5.8 AA) OR ≥24px spacing, OR exempt under one of the FIVE
2.5.8 exceptions: **inline/in-sentence links, user-agent-default controls, an equivalent larger control
elsewhere, essential targets (maps, data viz), or spacing-met**; all dragging has a single-pointer no-drag
alternative (2.5.7 AA); works with coarse AND fine pointers. FAIL: 16px icon buttons packed together, a list
reorderable only by drag, hover-only menus with no click/tap path. The floor is **24 CSS px** — do NOT
apply Apple's 44pt as the web standard. — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

### Base 9 — Accessibility · keyboard, focus visibility & order, focus-not-obscured  `wcag_external`
PASS: all functionality keyboard-operable, no traps (2.1.1/2.1.2 A); logical DOM focus order matching
reading order (2.4.3 A); visible focus on every focusable element via `:focus-visible`, never blanket
`outline:none` (2.4.7 AA), indicator meeting 3:1 (1.4.11); focused element not hidden by sticky headers/
toolbars/cookie bars (2.4.11 AA); focus moved into new context on route/dialog open, trapped in open modals,
restored to trigger on close. **STRETCH (AAA, NEVER an AA fail):** 2.4.13 Focus Appearance. FAIL: jumping
tab order, keyboard-unreachable widget, removed outline, sticky bar covering the focused input, modal
leaving focus behind. — https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html

### Base 10 — Accessibility · screen-reader semantics (HTML-first, then ARIA APG)  `wcag_external`
PASS: First Rule of ARIA — native HTML before roles; every control has an accessible name (visible
`<label for>`, or `aria-label`/`labelledby`), correct role, exposed state/value (4.1.2 A); structure via
real headings/lists/landmarks (1.3.1 A); icon-only buttons have text alternatives; custom widgets implement
the matching APG keyboard+state model; live updates use `aria-live`/`role=status` (4.1.3 AA). FAIL:
div-soup with bolted-on role, unlabeled icon buttons, redundant/incorrect roles, ARIA where a native
element exists, dynamic content silent to AT. — https://www.w3.org/TR/using-aria/

### Base 11 — Accessibility · reduced motion, media, captions & alt text  `wcag_external`
PASS: honors `prefers-reduced-motion` by removing/replacing non-essential animation (parallax, autoplay,
large transitions); no content flashes >3×/sec (2.3.1 A); informative images have meaningful alt,
decorative `alt=""` (1.1.1 A); video captioned (1.2.2 A), audio transcribed; no autoplay sound (1.4.2 A).
FAIL: motion ignoring the OS setting, autoplaying carousels/video with no pause, missing/duplicated alt,
uncaptioned tutorial video, seizure-risk flashing.
— https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### Base 12 — Responsiveness & robustness  `wcag_external`
PASS: content reflows with no loss and **no 2-D scrolling** when vertically-scrolling content is shown at
**320 CSS px wide** (= 1280px @ 400% zoom); horizontally-scrolling content at **256 CSS px tall** (vertical
scroll of vertical content and horizontal scroll of horizontal content are each allowed — orthogonal cases,
NOT an AND gate) (1.4.10 AA); text scales to **200%** with no clip/overlap (1.4.4 AA); survives text-spacing
overrides line-height 1.5× / paragraph 2× / letter 0.12em / word 0.16em (1.4.12 AA); both orientations work
unless essential (1.3.4 AA); fluid CSS (media/container queries, flex/grid, min/max); RTL mirrors layout +
directional icons via `dir=rtl`/logical properties. FAIL: horizontal scrollbar at mobile width, fixed-px
containers clipping at 200% zoom, text overlapping when spacing increases, orientation lock, LTR-only
layout. — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

### Base 13 — Motion & animation  `community_convention`
PASS: motion is purposeful and short (~150–300ms UI transitions) with standard easing; built on
`transform`/`opacity` (compositor-only), not layout/paint props; continuous animation pauses off-screen/
backgrounded; a `prefers-reduced-motion` alternative exists for everything (ties to Base 11). FAIL:
gratuitous looping decoration, long/janky transitions, animating `width`/`box-shadow`/`top`, motion with no
reduced-motion fallback. Mixed: "motion shows hierarchy" = `inference`; implementation = `community_convention`;
reduced-motion gate = `wcag_external` (2.3.3). — https://web.dev/articles/animations-guide

### Base 14 — Internationalization / localization  `community_convention`
PASS: `<html lang>` set and correct (3.1.1 A); UI strings externalized (no grammar-breaking concatenation);
layouts tolerate substantial text expansion (~30% for medium strings, more for short labels) without
clipping; dates/numbers/currency/units via `Intl`; no text baked into images; bidi via CSS logical
properties and `dir`; pluralization by the i18n layer. FAIL: hard-coded English, fixed-width buttons
truncating translations, MM/DD/YYYY assumed everywhere, fragment-assembled sentences, text-in-image labels.
Mixed: `lang` = `wcag_external` (3.1.1); rest = `community_convention`.
— https://www.w3.org/International/articles/article-text-size/

### Base 15 — Platform-fit (RIGHT vs WRONG to borrow)  `community_convention`
RIGHT: web-native chrome (top bar / left sidebar at desktop widths, breadcrumbs, right-click context menus,
hover affordances, keyboard shortcuts, persistent multi-pane), responsive collapse to a drawer/bottom bar at
narrow/touch widths, `system-ui` stack, working URL/Back/Forward. **WRONG to borrow:** iOS bottom tab bars
as default desktop nav, nav bars with iOS back-chevron, action sheets as the default modal (use `<dialog>`),
swipe-back gestures, segmented controls/picker wheels/iOS switches imposed for an "Apple look", SF Symbols.
EXCEPTION (`apple_published`, only IF present): Apple Pay on the Web / Sign in with Apple JS / MapKit JS —
render the official button/map unrestyled, keep MapKit's Apple logo + "Legal" link. Borrowing iOS chrome on
generic SaaS to "look Apple" is **cosplay → FLAG it**. Mixed: web conventions = `community_convention`;
anti-cosplay judgment = `inference` (no source_url); "HIG is Apple-platform-scoped" + the 3 components =
`apple_published`. — https://developer.apple.com/design/human-interface-guidelines/

---

## PROFILE A deltas — Web Application (SPA / PWA / SaaS)

### A1 — States (default/empty/loading/error/disabled/offline/no-permission/session-timeout)  `community_convention`
Every data-driven view defines ALL states. PASS: EMPTY explains what goes here + a primary action; LOADING
uses a skeleton/progress with reserved space (no layout shift), announced via `aria-busy`/live region; ERROR
names what failed in plain text, is programmatically associated, offers retry, **preserves user input**;
DISABLED controls explain why or are avoided for inline validation; OFFLINE detected and surfaced (PWA),
queued or read-only as appropriate; NO-PERMISSION explains + offers a path; SESSION TIMEOUT warns before
expiry, preserves entered data, supports re-auth without loss; status changes use a live region (4.1.3 AA).
FAIL: spinner-only loading with content jump, blank empty screens, silent failures, raw stack traces, errors
that clear the form, permanently greyed buttons with no explanation, silent session loss. Mixed: patterns =
`community_convention`; 4.1.3 = `wcag_external`. — https://www.nngroup.com/articles/empty-state-interface-design/

### A2 — Navigation & IA (app) + Consistent Help  `community_convention`
PASS: every primary view has a shareable, bookmarkable URL; Back/Forward/history work (WHATWG History/
Navigation API), not hijacked; persistent sidebar or top nav at wide widths collapsing to a disclosure/drawer
at narrow widths; clear active-state/where-am-I; landmarks (`<nav>`/`<main>`/`<header>`/`<aside>`) +
skip-to-content link; help mechanisms (contact, chat, self-help) in a consistent relative order across pages
(**Consistent Help 3.2.6 A**). FAIL: app-modal nav that breaks Back, no URL for deep states, dead-end pages,
mystery-meat nav, hamburger forced at desktop widths, help that moves around. Do NOT impose an iOS bottom tab
bar as the default web nav (**cardinal sin**). Mixed: URL/History = `community_convention`; Consistent Help =
`wcag_external`. — https://developer.mozilla.org/en-US/docs/Web/API/History_API

### A3 — Forms & validation  `wcag_external`
PASS: every field has a programmatically associated visible `<label>` (3.3.2 A); appropriate `type`/
`inputmode`/`autocomplete`; errors identified in text and tied to the field via `aria-describedby` (3.3.1 A)
with constructive suggestions (3.3.3 AA); required state/constraints stated up front; submit success/failure
announced via a live region (4.1.3 AA); input preserved on error; do not force re-entering data already
provided (**Redundant Entry 3.3.7 A**); no cognitive-test-only auth — allow paste, password managers,
alternatives (**Accessible Authentication 3.3.8 AA**); errors/required/validity never by color alone
(1.4.1 A). FAIL: placeholder-as-label, color-only error states, errors that wipe the form, blocked paste in
password/OTP, captcha-as-only-auth, missing autocomplete on name/email/address.
— https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html

### A4 — Perceived performance  `community_convention`
PASS: above-the-fold content prioritized; async regions show skeletons sized to eventual content so nothing
jumps (low CLS); optimistic UI for low-risk actions (apply immediately, reconcile/rollback on failure);
feedback within ~100ms of any interaction; long tasks show determinate progress; reserved space for images/
embeds (`width`/`height` or `aspect-ratio`). FAIL: blank screen then full-page pop-in, content shifting as
data loads, no feedback on click causing double-submits, images with no reserved dimensions.
— https://web.dev/articles/cls

### A5 — Feedback & affordances  `community_convention`
PASS: every interactive element has visible hover, active/pressed, focus, and disabled states distinct from
default; clickable things look clickable; system status always visible (saving/saved, online/offline,
progress) per Nielsen H1; destructive/irreversible actions require confirmation or offer undo (H3); transient
confirmations (toasts) are announced to AT and dismissible; cursor reflects affordance. FAIL: flat
unresponsive controls, silent saves, irreversible delete with no confirm/undo, toast that vanishes before it
can be read or is invisible to screen readers. — https://www.nngroup.com/articles/ten-usability-heuristics/

---

## PROFILE B deltas — Marketing / Content Website

### B1 — Content hierarchy & scannability  `community_convention`
PASS: scannable structure — front-loaded key info (F-pattern), descriptive headings/subheads, short
paragraphs, bulleted lists; one clear page H1; visible type-scale steps; body ≥16px; one clear primary CTA
per view; plain specific language. FAIL: walls of text with no subheads, vague "Learn more" everywhere, value
prop buried in fluff, body <16px, inconsistent product naming, multiple competing H1s.
— https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

### B2 — Navigation & IA (site) + single-page exception  `community_convention`
PASS (multi-page): persistent top header nav (hamburger at narrow widths), logo links home, current section
indicated, footer with sitemap/legal/contact, breadcrumbs on **DEEP** docs, shallow scannable IA. PASS
(single-page landing — explicit exception): in-page anchor nav + a working skip-link + a path to any deeper
pages; **breadcrumbs/current-section indicator are N/A and MUST NOT be flagged as missing.** FAIL: app-style
bottom tab bar on a marketing site, nav hiding primary sections, no path home, orphaned pages, icon-only nav
with no labels. Do NOT impose iOS chrome. — https://www.nngroup.com/articles/top-tasks-definitive-method/

### B3 — States (content-lite)  `community_convention`
PASS: branded 404/500 with route home + search; empty search-results state with guidance; form submit
loading indicator; specific recoverable form/server errors; success confirmation after submit; graceful
slow-network (cached/skeleton, no infinite spinner). **Prefer an enabled submit that validates on click and
moves focus to the first error** over a permanently-disabled button; if a control IS disabled, explain why
and make the reason programmatically available (not color/opacity alone). FAIL: blank screen on no results,
default browser 404, submit with no feedback, generic "Something went wrong". **Do NOT require app-state
rigor** — no optimistic-UI/offline-app/skeleton-everywhere mandate.
— https://www.nngroup.com/articles/error-message-guidelines/

### B4 — Perceived performance (Core Web Vitals)  `community_convention`
PASS: Core Web Vitals "good" at p75 — LCP ≤2.5s, INP ≤200ms, CLS ≤0.1; LCP hero image preloaded/prioritized
(NOT lazy); below-fold images `loading="lazy"`; responsive `srcset`/`sizes` + modern formats (AVIF/WebP);
fonts with `font-display:swap` + `size-adjust`; explicit `width`/`height` or `aspect-ratio` on media. FAIL:
LCP >4s, CLS >0.25 from late images/fonts/ads, render-blocking resources, full-res images to phones,
FOUT/FOIT text shift. — https://web.dev/articles/vitals

### B5 — Forms & validation (newsletter/contact)  `wcag_external`
PASS: visible persistent `<label>` per field (3.3.2 A, not placeholder-as-label); correct `type`/`inputmode`/
`autocomplete`; inline validation with specific recoverable messages tied to the field via `aria-describedby`
(3.3.1 A / 3.3.3 AA); error summary + focus to first error; success confirmation; no re-asking the same info
(3.3.7 A); accessible captcha; errors never by color alone (1.4.1 A). FAIL: placeholder-only labels,
native-default-only validation, red-border-only errors, no success state, inaccessible captcha, email field
as `type=text`. — https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html

### B6 — SEO-adjacent semantic structure  `community_convention`
PASS: semantic document outline (single descriptive H1, ordered headings with no skips) doubling as SEO
structure; descriptive `<title>` + meta description per page; schema.org/Open Graph where relevant; canonical
URLs; no keyword-stuffed or empty headings. FAIL: multiple/zero H1, generic page titles, missing meta,
heading levels used for styling. Mixed: heading structure = `wcag_external` (1.3.1); title/meta/schema/OG/
canonical = `community_convention`. — https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements

---

## Platform-fit notes (both profiles)

- **RIGHT to use:** web-native nav (top bar / sidebar), breadcrumbs, hover + right-click menus, keyboard
  shortcuts, responsive breakpoints, the `system-ui` font stack, real URLs/History.
- **WRONG to borrow (the cardinal sin):** iOS bottom tab bars, large-title nav bars, action sheets/sheets as
  the default modal, segmented controls / picker wheels / iOS switches for an "Apple look", SF Symbols, 44pt
  targets as a web floor. Flag these as `platform-fit` failures.
- **Conditional Apple visual language:** legitimate only on a genuine Apple-ecosystem surface; the three
  official Apple web components are the only `apple_published` exception, rendered unrestyled.
