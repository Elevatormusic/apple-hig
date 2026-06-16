---
title: Maps
source_url: https://developer.apple.com/design/human-interface-guidelines/maps
platforms: [ios, ipados, macos, tvos, visionos, web]
value_type: platform-specific
last_verified: 2026-06-15
---

> ⚠️ Re-verify on Apple. Verify on Apple as the HIG migrates from the 26 to the 27/Golden Gate generation.

# Maps

## Purpose

MapKit lets you embed an interactive Apple map in your app to show places, routes, and context. Use a map to give people a real sense of place — with annotations, overlays, Look Around, and directions — without cluttering the view.

## Anatomy

- **Annotations / markers** — pins or custom views marking points (`Marker`, `Annotation`).
- **Overlays** — shapes drawn on the map (routes, regions, heatmaps).
- **Map controls** — user-location button, compass, scale, pitch/3D, zoom.
- **Look Around** — street-level immersive imagery for supported locations.
- **Selectable map features** — built-in POIs people can tap for details.

## Guidelines

- **Don't clutter the map.** Show only relevant annotations; cluster dense pins; let detail emerge as people zoom. Avoid burying the map under chrome.
- **Use the standard user-location flow.** Request location **in context** with a clear purpose string; support "While Using" and approximate location; don't demand precise/always location unless truly needed. See [[privacy]].
- **Make annotations legible and tappable** (≥44 pt targets) and give each a clear title/subtitle and accessible label.
- **Offer Look Around** where it adds orientation value; provide a clear entry point and a way back to the map.
- **Hand off directions appropriately** — open Apple Maps for full turn-by-turn rather than reimplementing navigation, unless navigation is your app's purpose.
- **Respect map styling and attribution.** Use `MapStyle` (standard/imagery/hybrid); keep the Apple attribution and legal links visible and unobstructed.
- **Keep controls clear of safe areas** and the Dynamic Island / sensor regions. See [[layout]].

## API

- **MapKit for SwiftUI**: `Map`, `Marker`, `Annotation`, `MapPolyline`, `MapCircle`, `MapStyle`, `LookAroundPreview`, `MapUserLocationButton`, `MapCompass`, `MapScaleView`.
- **MapKit (UIKit/AppKit)**: `MKMapView`, `MKAnnotation`/`MKAnnotationView`, `MKOverlay`/`MKOverlayRenderer`, `MKLookAroundScene`, `MKDirections`, `MKLocalSearch`.
- Location via **Core Location** (`CLLocationManager`); request authorization in context.

## MapKit JS (web)

> Source: https://developer.apple.com/maps/web/ · current generation **MapKit JS 6** · re-verify the version and token flow on Apple.

Real Apple Maps on the **web** is **MapKit JS** — it renders genuine Apple map tiles, search, and annotations in the browser. Reach for it (not a static screenshot or a third-party basemap) when a web app genuinely needs Apple Maps; for a generic locator a lightweight vector map is often enough.

**Authorization (MapKit JS 6).** v6 authenticates with a **static token bound to your website's domain** — no private key in the client and no JWT-signing endpoint. Mint the token from your Apple Developer account (Maps IDs / Maps Tokens), restrict it to your origin(s), and inject it at build/deploy time (e.g. a `MAPKIT_TOKEN` env var) — **never commit it to a public repo**. (MapKit JS 5 instead signed a short-lived ES256 JWT server-side and handed it back through an `authorizationCallback`; prefer v6 for new work.)

**Load + initialize**
- npm / build pipeline: `import { load } from "@apple/mapkit-loader"; const mapkit = await load({ libraries: ["map","annotations","services"], token: MAPKIT_TOKEN });`
- script tag / prototyping: `<script src="https://cdn.apple-mapkit.com/mk/6/mapkit.core.js" crossorigin async data-libraries="map,annotations" data-token="…" data-callback="initMapKit"></script>` — build the map inside `initMapKit`.

**Build the map (HIG-correct)**
- `new mapkit.Map(el, { colorScheme })` — sync `colorScheme` to `prefers-color-scheme` (`Light`/`Dark`/`Auto`) and update it on change so the map matches the system appearance. See [[dark-mode]].
- Prefer the standard controls over custom chrome: `showsUserLocationControl`, `showsCompass: mapkit.FeatureVisibility.Adaptive`, `showsScale`, `showsZoomControl`.
- Annotations: `new mapkit.MarkerAnnotation(coord, { title, glyphText, color, accessibilityLabel })`; keep targets ≥44 pt and never encode meaning in pin color alone.
- Routes / regions: `mapkit.PolylineOverlay`, `mapkit.CircleOverlay`.

**Web HIG rules**
- **Keep Apple's attribution and "Legal" link visible and unobstructed** — MapKit JS draws the Apple logo + legal link; don't cover, restyle, or remove them (required by the terms and [[branding]]).
- Give the map container an accessible name, and make sure keyboard users can reach the controls.
- Honor **Reduce Motion**: don't auto-fly the camera or animate annotations under `prefers-reduced-motion: reduce` — set the region directly instead. See [[motion]].
- Request location **in context** with a clear purpose ([[privacy]]); the browser's permission prompt is the gate — don't pre-prompt.
- Don't impose iOS chrome on the surrounding page — let the map be the Apple surface and keep the host page's own conventions.

## Accessibility

- Provide VoiceOver labels for annotations and controls; don't encode meaning in pin color alone. Support Dynamic Type in callouts; keep targets ≥44 pt (60 pt visionOS). See [[accessibility]].

## Do / Don't

- ✅ Cluster pins, reveal detail on zoom, keep Apple attribution visible.
- ✅ Request location in context; support approximate location.
- ❌ Don't flood the map with pins or hide the map under panels.
- ❌ Don't demand precise/always location without need.

See also: [[privacy]], [[layout]], [[accessibility]], [[ios]], [[visionos]]
