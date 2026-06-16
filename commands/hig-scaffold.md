---
description: Generate a HIG-compliant component or screen for a chosen Apple platform and stack (SwiftUI, UIKit, React Native, Flutter, HTML/CSS, etc.), using the on-disk Apple guidelines.
argument-hint: "<platform> <component/screen> [stack] — e.g. \"ios settings screen swiftui\" or \"visionos detail view\""
allowed-tools: Read, Grep, Glob, Skill, Write, Edit
---

Generate a HIG-compliant component or screen.

**Request:** $ARGUMENTS
Parse it for: target **platform** (ios | ipados | macos | watchos | tvos | visionos | web), the
**component/screen** to build, and the **stack** (default to SwiftUI for Apple platforms; ask if a
web/cross-platform target is ambiguous).

Steps:

1. **Engage the `apple-hig` skill** to load the right guidelines. The skill resolves the bundled file
   paths and its routing table maps the platform + component to the specific
   `foundations/`, `platforms/`, `components/`, and `patterns/` files to read (and
   `references/design-tokens.md` for exact values). Load only what's relevant — don't read the whole
   guidelines folder.
2. **Generate code** in the chosen stack that is compliant by construction:
   - Prefer **system components**; use **semantic colors** (never hardcoded hex) and **text styles**
     (Dynamic Type), not fixed sizes.
   - Meet **44×44 pt** (60 pt visionOS) targets; on-grid spacing (4/8 pt rhythm); concentric/capsule
     radii; safe areas; leading/trailing (RTL-safe).
   - Provide **light + dark** appearances; **VoiceOver labels** on icon-only controls; a **Reduce
     Motion** alternative for any animation.
   - **Animate cheaply:** only `transform`/`opacity`; don't loop-animate layout/paint props
     (`box-shadow`, `width`, `clip`) or read layout (`getBoundingClientRect`, `getPointAtLength`) inside
     the loop; avoid animating expensive `filter`/`backdrop-filter` blur; pause continuous animation
     when off-screen or the tab/app is backgrounded.
   - Use the platform's current design language (Liquid Glass chrome on the 26/27 generation; do not
     put glass on the content layer).
   - For **web/Android** targets: keep Apple principles + tokens but use the host platform's
     conventions; don't impose iOS chrome.
3. **Annotate** the generated code with brief comments noting which HIG rule each choice satisfies.
4. **Summarize** what you built and list any decisions to confirm (tint color, number of tabs, etc.).
   Offer to run `/hig-review` on the result.

**Apple Maps requests** (a map view/screen) route to `technologies/maps.md`. Emit a real Apple Maps
integration, not a stand-in:
- **Web** → **MapKit JS** (the MapKit JS 6 `@apple/mapkit-loader` or `mapkit.core.js` loader). Read the
  domain-bound token from an env var (`MAPKIT_TOKEN`) — **never hardcode or commit a token**. Sync
  `colorScheme` to `prefers-color-scheme`, keep Apple's attribution + Legal link visible, honor Reduce
  Motion, and use the standard map controls.
- **Apple platforms** → SwiftUI `Map` (or `MKMapView`), with `MapUserLocationButton`/`MapCompass`,
  semantic styling, in-context Core Location, and ≥44 pt annotation targets.
