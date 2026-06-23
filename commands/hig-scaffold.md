---
description: Generate a HIG-compliant component or screen for a chosen Apple platform and stack (SwiftUI, UIKit, React Native, Flutter, HTML/CSS, etc.), using the on-disk Apple guidelines.
argument-hint: "<platform> <component/screen> [stack] — e.g. \"ios settings screen swiftui\" or \"visionos detail view\""
allowed-tools: Read, Grep, Glob, Skill, Write, Edit
---

Generate a HIG-compliant component or screen — **plan the product and structure first, then write code.**

**Request:** $ARGUMENTS
Parse it for: target **platform** (ios | ipados | macos | watchos | tvos | visionos | web), the
**component/screen** to build, and the **stack** (default to SwiftUI for Apple platforms; ask if a
web/cross-platform target is ambiguous).

## Step 1 — Load the guidelines

**Engage the `apple-hig` skill** to load the right files: `universal.md`, the platform file (including its
**Design rubric** — judge by THIS platform, not iOS defaults), and the few `foundations/`, `components/`,
`patterns/` files relevant to the request (and `references/design-tokens.md` for exact values). Load only
what's relevant.

## Step 2 — Plan before code (do this BEFORE generating anything)

A polished screen built around the wrong structure is still wrong. Produce a short plan first; where the
request doesn't specify something, **infer it and list the assumption** so the user can correct it.

**Screen definition / product assumptions:** user; primary task; success condition; primary content;
primary action (may be **none** — a monitoring/reading/browsing screen needn't have a CTA);
secondary/destructive actions; navigation context; data density; accessibility risks; and the
**deployment target** — minimum OS / SDK and a fallback policy (this decides whether current-generation
APIs like Liquid Glass are even available).

**Hierarchy plan:** page context → current status → primary content → primary action / next step →
secondary controls → advanced / diagnostic. (State *why* information is ordered as shown.)

**State plan:** which of default / loading / empty / error / disabled / offline / permission-denied apply,
and how each is handled — loading and errors must not rely on color or motion alone, and errors show a
recovery path.

**Responsive plan:** compact / regular, largest Dynamic Type, landscape / resized, keyboard + pointer,
RTL.

## Step 3 — Generate the code

Apply the plan, in the chosen stack, deferring to the **platform's design rubric** (not iOS defaults
everywhere):
- **Platform-appropriate** targets, spacing, navigation, and density — e.g. macOS is dense with ~28pt
  controls + a complete menu bar; iPad restructures for regular width; tvOS is focus-driven with 56/66pt
  targets; visionOS uses 60pt gaze targets; web uses web-native chrome. Don't impose iPhone 44pt / one-CTA
  / bottom-tab-bar conventions on platforms where the rubric says otherwise.
- **Semantic colors** (never hardcoded hex), **text styles** / Dynamic Type (not fixed sizes), **light +
  dark** appearances, **VoiceOver** label + value + traits on controls, a **Reduce Motion** alternative.
- **Animate cheaply:** only `transform`/`opacity`; don't loop-animate layout/paint props or read layout
  inside the loop; avoid animating expensive `filter`/`backdrop-filter` blur; pause continuous animation
  when off-screen or backgrounded.
- **Deployment-target aware:** if an API isn't in the minimum OS, emit `#available` checks / a legacy
  fallback (e.g. an opaque material where Liquid Glass is unsupported) — don't default to current-gen APIs
  without confirming support.
- **Liquid Glass** on chrome/controls only, never the content layer. **Web/Android:** keep Apple
  principles + tokens but use the host platform's conventions; don't impose iOS chrome.

## Step 4 — Keep rationale out of production code

Put the HIG reasoning in the **plan and the summary**, not as a comment on every line. Only comment
genuinely **non-obvious** decisions in the code itself.

## Step 5 — Validate, don't just assert

Generated code is a draft, **not "compliant by construction."** When tools are available, offer to
**compile / typecheck / render** it, and report what was and wasn't verified. Then **summarize** the plan
+ what you built, list the assumptions to confirm (deployment target, tint, tab count, map provider), and
offer to run `/hig-review` on the result.

## Apple Maps requests

A map view/screen routes to `technologies/maps.md`. **Recommend** MapKit where it fits, but treat the map
provider as a **product/architecture decision, stated as an assumption** — don't force Apple Maps for
every map (cost, account, privacy, existing stack, and coverage all matter). When MapKit is chosen:
- **Web** → **MapKit JS** (the MapKit JS 6 `@apple/mapkit-loader` or `mapkit.core.js` loader). Read the
  domain-bound token from an env var (`MAPKIT_TOKEN`) — **never hardcode or commit a token**. Sync
  `colorScheme` to `prefers-color-scheme`, keep Apple's attribution + Legal link visible, honor Reduce
  Motion, and use the standard map controls.
- **Apple platforms** → SwiftUI `Map` (or `MKMapView`), with `MapUserLocationButton`/`MapCompass`,
  semantic styling, in-context Core Location, and platform-appropriate annotation targets.
