// Deterministic microcopy checks (review-router "Microcopy & consistency" row).
// Definitions are research-validated (spec 2026-06-24, microcopy section): every check is
// advisory-tier except casing-consistency (the one deterministic near-fail). Do NOT cite
// WCAG 3.1.2 for casing (it governs language, not capitalization); SC 3.1.4/3.1.3 are AAA.
const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'for', 'with']);
const DEFAULT_ACRONYM_ALLOWLIST = ['OK', 'USB', 'URL', 'ID', 'PDF', 'HTML', 'CSS', 'API', 'GPS', 'WIFI', 'HDMI', 'AM', 'PM'];
const UNIT_TOKENS = new Set(['DB', 'HZ', 'KHZ', 'MS', 'PT', 'PX', 'FPS', 'KB', 'MB', 'GB']);
const NO_VALUE_TOKENS = ['—', '–', '-', 'N/A', 'n/a', 'NA', '--'];
const DESTRUCTIVE_VERBS = /^(delete|remove|erase|reset|discard|clear|revoke|unlink)\b/i;

const tokens = (s) => s.split(/[^A-Za-z0-9]+/).filter(Boolean);
const isAcronymish = (t) => /^[A-Z]{2,6}[0-9]?$/.test(t);
const find = (check, severity, authority, message, offenders) =>
  ({ check, severity, authority, message, offenders });

// 1) Casing consistency — apple_published (Writing HIG: one casing style, applied consistently).
export function casingConsistency(labels, opts = {}) {
  const allow = new Set((opts.acronymAllowlist ?? DEFAULT_ACRONYM_ALLOWLIST).map(a => a.toUpperCase()));
  const groups = new Map();
  for (const s of labels) {
    const toks = tokens(s);
    if (!toks.length) continue;
    // single tokens that are acronyms/units/allowlisted can't establish a casing conflict
    if (toks.length === 1 && (allow.has(toks[0].toUpperCase()) || UNIT_TOKENS.has(toks[0].toUpperCase()))) continue;
    const norm = toks.map(t => t.toLowerCase()).join(' ');
    if (!groups.has(norm)) groups.set(norm, new Set());
    groups.get(norm).add(s);
  }
  const out = [];
  for (const [norm, forms] of groups) {
    if (forms.size >= 2) {
      out.push(find('casing-consistency', 'medium', 'apple_published',
        `"${norm}" ships in ${forms.size} different case patterns on one surface — pick title case OR sentence case and apply it consistently (Writing HIG).`,
        [...forms]));
    }
  }
  return out;
}

// 2) Redundant copy (DRY) — apple_published principle, inference detector. OFF by default.
// Deterministic threshold: a non-stopword token >=3x within ONE control's string (2x needs the
// disambiguation judgment the reviewer applies, not a script), or control-token == section label.
export function redundantCopy(labels, opts = {}) {
  const out = [];
  const section = opts.sectionLabel ? tokens(opts.sectionLabel).map(t => t.toLowerCase()) : [];
  for (const s of labels) {
    const counts = new Map();
    for (const t of tokens(s).map(t => t.toLowerCase())) {
      if (STOPWORDS.has(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [t, n] of counts) {
      if (n >= 3) {
        out.push(find('redundant-copy', 'low', 'inference',
          `"${t}" appears ${n}x in one label ("${s}") — cut the repeats if the meaning survives (Writing HIG: be concise; detector is inference).`, [s]));
      } else if (section.includes(t)) {
        out.push(find('redundant-copy', 'low', 'inference',
          `"${t}" repeats the section label "${opts.sectionLabel}" — usually droppable inside its own section.`, [s]));
      }
    }
  }
  return out;
}

// 3) Long all-caps — community_convention (NN/g: all-caps AIDS short glanceable labels, hurts runs).
export function longAllCaps(labels, opts = {}) {
  const maxChars = opts.maxChars ?? 15;
  const out = [];
  for (const s of labels) {
    const letters = s.replace(/[^A-Za-z]/g, '');
    if (!letters || letters !== letters.toUpperCase()) continue;
    const words = tokens(s);
    if (words.length === 1 && isAcronymish(words[0])) continue;
    if (words.length > 2 || s.length > maxChars) {
      out.push(find('long-all-caps', 'info', 'community_convention',
        `Passage-style all-caps "${s}" hurts scanability (NN/g); short eyebrow labels are fine — this one is ${words.length} words.`, [s]));
    }
  }
  return out;
}

// 4) Unexplained acronym — wcag_external SC 3.1.4 Abbreviations (AAA -> always advisory).
export function unexplainedAcronym(labels, opts = {}) {
  const allow = new Set((opts.acronymAllowlist ?? DEFAULT_ACRONYM_ALLOWLIST).map(a => a.toUpperCase()));
  const severity = opts.profile === 'pro-tool' ? 'info' : 'low';
  const joined = labels.join('\n');
  const out = [];
  const seen = new Set();
  for (const s of labels) {
    // A fully all-caps multi-word label is STYLING — its words are indistinguishable from
    // acronyms, and the long-all-caps check owns that label. Skip it here.
    const letters = s.replace(/[^A-Za-z]/g, '');
    if (letters && letters === letters.toUpperCase() && tokens(s).length > 1) continue;
    for (const t of tokens(s)) {
      if (!isAcronymish(t) || allow.has(t) || UNIT_TOKENS.has(t.toUpperCase()) || seen.has(t)) continue;
      seen.add(t);
      // explained anywhere on the surface? "XXX (expansion…)" or "…expansion (XXX)"
      const explained =
        new RegExp(`${t}\\s*\\([^)]{4,}\\)`).test(joined) ||
        new RegExp(`[A-Za-z][^(\\n]{3,}\\(\\s*${t}\\s*\\)`).test(joined);
      if (!explained) {
        out.push(find('unexplained-acronym', severity, 'wcag_external',
          `"${t}" has no expansion/gloss on this surface (WCAG 3.1.4, AAA — advisory). Add it to the audience allowlist if it is house-standard.`, [t]));
      }
    }
  }
  return out;
}

// 5) Placeholder glyphs — split: ellipsis correctness (apple_published, default-on) vs
// no-value standardization (community_convention/inference, off-by-default).
export function placeholderGlyphs(labels, opts = {}) {
  const out = [];
  const dots = labels.filter(s => s.includes('...'));
  if (dots.length) {
    out.push(find('ellipsis-correctness', 'low', 'apple_published',
      'Use the ellipsis character … (U+2026), not three periods (Writing HIG / typography).', dots));
  }
  if (opts.standardization) {
    const used = NO_VALUE_TOKENS.filter(tok => labels.some(s => s.trim() === tok));
    if (used.length >= 2) {
      out.push(find('glyph-standardization', 'advisory', 'community_convention',
        `Mixed no-value placeholders (${used.join(' vs ')}) for the same semantic — standardize on one (fires only on standalone comparable values).`, used));
    }
  }
  return out;
}

// 6) Destructive verb — apple_published principle (Alerts HIG), worded as PROMPT-TO-VERIFY since
// confirm/undo is invisible in a label. Medium ONLY in the gated WCAG 3.3.4 case.
export function destructiveVerb(labels, opts = {}) {
  const out = [];
  for (const s of labels) {
    if (tokens(s).length <= 4 && DESTRUCTIVE_VERBS.test(s.trim())) {
      out.push(find('destructive-verb', opts.persistedData ? 'medium' : 'advisory',
        'apple_published',
        `"${s}" is destructive — VERIFY it has a confirmation or undo (not asserted as a violation; a label cannot show the handler).${opts.persistedData ? ' Persisted/legal/financial data: WCAG 3.3.4 (AA) applies.' : ''}`, [s]));
    }
  }
  return out;
}

export function runMicrocopyChecks(labels, options = {}) {
  const enable = options.enable ?? {};
  const out = [
    ...casingConsistency(labels, options),
    ...longAllCaps(labels, options),
    ...unexplainedAcronym(labels, options),
    ...placeholderGlyphs(labels, { ...options, standardization: enable.glyphStandardization ?? false }),
    ...destructiveVerb(labels, options),
  ];
  if (enable.redundantCopy) out.push(...redundantCopy(labels, options));
  return out;
}
