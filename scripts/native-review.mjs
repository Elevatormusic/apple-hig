// Native review: consume a native-render descriptor (the JUCE design probe's output) and produce findings by
// reusing the plugin's existing measurement math — wcag-contrast (contrast), layout-robustness (overlap/
// target geometry), visual-weight (hierarchy). Findings are `evidence: extracted` (deterministic from the
// live component tree, but NOT a pixel render). Contrast is scored ONLY on introspectable (`measurable`)
// nodes; a coverage ratio is reported so a heavily custom-painted UI is never mistaken for "fully reviewed".

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { contrastRatio } from './wcag-contrast.mjs';
import { boxesOverlap, overlapDepth } from './layout-robustness.mjs';
import { visualWeight } from './visual-weight.mjs';
import { validateDescriptor } from './native-descriptor.mjs';

const isLarge = (el) => el.fontPt >= 18 || (el.bold && el.fontPt >= 14);
const rect = (b) => ({ left: b.x, top: b.y, right: b.x + b.w, bottom: b.y + b.h });
// full containment = parent/child nesting (the probe emits a flat tree with absolute bounds), NOT a collision.
const contains = (p, q) => p.left <= q.left && p.top <= q.top && p.right >= q.right && p.bottom >= q.bottom;
const interactive = (el) => /button|toggle|slider|combo/i.test(el.type) || /button|link|slider|checkbox/i.test(el.role);

export function coverage(elements) {
  const total = elements.length;
  const measurable = elements.filter((e) => e.measurable).length;
  return { total, measurable, ratio: total ? measurable / total : 0 };
}

export function contrastFindings(elements) {
  const out = [];
  for (const el of elements) {
    if (!el.measurable || !el.fgIntrospectable || !el.bgIntrospectable) continue; // never score a custom-painted node
    if (!el.label && !el.value) continue;
    const ratio = contrastRatio(el.fg, el.bg);
    const floor = isLarge(el) ? 3 : 4.5;
    if (ratio < floor) out.push({ category: 'contrast', severity: ratio < floor - 1 ? 'high' : 'medium', element: el.id, ratio: +ratio.toFixed(2), evidence: 'extracted', message: `text contrast ${ratio.toFixed(2)}:1 is below ${floor}:1 (registered colours — an approximation of the drawn pixel)` });
  }
  return out;
}

export function geometryFindings(elements) {
  const out = [];
  const vis = elements.filter((e) => e.visible && e.showing);
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], b = vis[j];
    const ra = rect(a.bounds), rb = rect(b.bounds);
    const overlap = boxesOverlap(ra, rb) && overlapDepth(ra, rb) > 2;
    const nested = contains(ra, rb) || contains(rb, ra); // child inside its ancestor — not a collision
    const identical = a.type === b.type && a.label && a.label === b.label && a.bounds.w === b.bounds.w && a.bounds.h === b.bounds.h;
    if (identical) out.push({ category: 'duplicate', severity: overlap ? 'high' : 'medium', element: b.id, evidence: 'extracted', message: `identical "${a.label}" (${a.type}) appears twice — ${a.id} & ${b.id}${overlap ? ', overlapping (painted twice)' : ' (stacked — confirm against the snapshot)'}` });
    else if (overlap && !nested) out.push({ category: 'overlap', severity: 'medium', element: b.id, evidence: 'extracted', message: `${b.id} overlaps ${a.id} by ${overlapDepth(ra, rb)}px` });
  }
  for (const el of vis) if (interactive(el) && (el.bounds.w < 24 || el.bounds.h < 24)) out.push({ category: 'target-size', severity: 'medium', element: el.id, evidence: 'extracted', message: `${el.bounds.w}×${el.bounds.h}px target is below the 24px pointer floor (WCAG 2.5.8 — not Apple's 44pt)` });
  for (const el of vis) if (el.textOverflows) out.push({ category: 'clip', severity: 'medium', element: el.id, evidence: 'extracted', message: `"${(el.label || el.value || '').slice(0, 32)}" overflows its bounds and is clipped/truncated` });
  return out;
}

export function hierarchyFindings(elements) {
  const ranked = elements
    .filter((e) => e.visible && e.showing && (e.label || e.value))
    .map((e) => ({ el: e, weight: visualWeight({ area: e.bounds.w * e.bounds.h, contrast: (e.fgIntrospectable && e.bgIntrospectable) ? contrastRatio(e.fg, e.bg) : 4, filled: false, bold: e.bold }) }))
    .sort((a, b) => b.weight - a.weight);
  if (!ranked.length) return [];
  const top = ranked[0].el;
  return [{ category: 'hierarchy', severity: 'low', element: top.id, evidence: 'extracted', message: `dominant element by visual weight: ${top.id} ("${(top.label || top.value).slice(0, 32)}")` }];
}

export function reviewNativeDescriptor(descriptor) {
  const els = descriptor.elements || [];
  const findings = [...contrastFindings(els), ...geometryFindings(els), ...hierarchyFindings(els)];
  const cov = coverage(els);
  const blocking = findings.some((f) => f.severity === 'high' || f.severity === 'critical');
  // a native (introspection) review is deterministic but not a pixel render — never `verified-pass`.
  return { findings, coverage: cov, verdict: blocking ? 'fail' : 'advisory-pass' };
}

// --- CLI: `node scripts/native-review.mjs <descriptor.json> [--json]` ---
// The design-reviewer subagent has no Bash and no browser for native, so the `/hig-review` command (which
// has Bash) runs THIS on a JUCE design-probe descriptor to get the measured findings.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const path = process.argv[2];
  if (!path) { console.error('usage: node native-review.mjs <descriptor.json> [--json]'); process.exit(2); }
  let desc;
  try { desc = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { console.error(`cannot read ${path}: ${e.message}`); process.exit(2); }
  const errs = validateDescriptor(desc);
  if (errs.length) { console.error(`not a valid native-render descriptor:\n  ${errs.join('\n  ')}`); process.exit(2); }
  const r = reviewNativeDescriptor(desc);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  const pct = (r.coverage.ratio * 100).toFixed(0);
  console.log(`Native JUCE review (evidence: extracted) — verdict: ${r.verdict}  ·  never verified-pass (not a pixel render)`);
  console.log(`Coverage: ${r.coverage.measurable}/${r.coverage.total} nodes introspectable (${pct}%); custom-painted nodes are NOT contrast-scored.`);
  const order = { critical: 0, high: 1, medium: 2, low: 3, advisory: 4 };
  const sorted = [...r.findings].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  if (!sorted.length) console.log('  (no measured issues on the introspectable subset)');
  for (const f of sorted) console.log(`  [${f.severity}] ${f.category} — ${f.element}: ${f.message}`);
  console.log('Confirm the duplicate/clip/overlap class against the snapshot PNG.');
  process.exit(0);
}
