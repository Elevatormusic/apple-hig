// Recipe-token parser: reads the two macOS control/design token reference tables and turns the per-control
// STATE RECIPES (control-tokens-macos.md) into an addressable, alias-resolved data model. Dependency-free
// (node built-ins only) — the whole grammar is String.split / trim / regex, no markdown library. The grammar
// is the machine-verified 2026-07-02 ground truth (see private/2026-07-02-state-checker-research.json); the
// pinned counts in test/recipe-tokens.test.mjs are authoritative — if this parser disagrees, this parser is
// wrong. Downstream (the state checker) diffs a live JUCE probe's sampled pixels against get(...) recipes.

// ---------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------

const splitLines = (text) => text.split(/\r?\n/);
const stripBold = (s) => s.replace(/\*\*/g, ''); // markdown bold — "(**dark**)" flags a deliberate value, not a typo
// Strip ONE trailing italic annotation: "  *(...)*". The stripped text may itself be a shadow recipe
// (line 323), so callers that care about it read it back off the cell; here we only remove it for layer split.
const stripAnnotation = (cell) => cell.replace(/\s*\*\((.+)\)\*\s*$/, '').trim();

// compositeAlpha: opacity of N stacked translucent layers = 1 − ∏(1 − αᵢ). Order-independent; used by the
// tier-2 direction model (compare COMPOSITED alpha, never per-layer alpha).
export function compositeAlpha(layers) {
  let product = 1;
  for (const l of layers) product *= (1 - (l.alpha ?? 0));
  return 1 - product;
}

// ---------------------------------------------------------------------------------------------------------
// Table extraction: a table is a maximal run of lines whose trimmed form starts with '|'. Row cells =
// line.split('|').slice(1, -1).map(trim). rows[0]=header, rows[1]=separator, rest=data.
// ---------------------------------------------------------------------------------------------------------

function extractTables(lines) {
  const tables = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('|')) {
      if (!cur) { cur = { rows: [], lineStart: i }; tables.push(cur); }
      cur.rows.push(t.split('|').slice(1, -1).map((s) => s.trim()));
    } else {
      cur = null;
    }
  }
  return tables;
}

// ---------------------------------------------------------------------------------------------------------
// COLOR := `#RRGGBB` with an optional alpha in one of the three verified notations:
//   " α0.16"  (bare)      • " (α1.0)" / " (α1)"  (parenthesised)      • bare hex ⇒ implied α1.0
// U+03B1 is the alpha glyph. Returns {hex, alpha} or null.
// ---------------------------------------------------------------------------------------------------------

const COLOR_RE = /^`(#[0-9A-Fa-f]{6})`(?:\s*α(\d+(?:\.\d+)?)|\s*\(α(\d+(?:\.\d+)?)\))?$/;

function parseColor(seg) {
  const m = seg.trim().match(COLOR_RE);
  if (!m) return null;
  const alphaStr = m[2] ?? m[3];
  return { hex: m[1], alpha: alphaStr === undefined ? 1 : Number(alphaStr) };
}

// ---------------------------------------------------------------------------------------------------------
// ALIAS := "-> Group / Path". Three productions (all forms verified exhaustive over the 29 targets):
//   SYS-simple   -> System Colors / <Color> (light|dark)              [bold may wrap the appearance]
//   SYS-vibrant  -> System Colors / <VariantCol> / <Color>           [VariantCol carries a blend tag]
//   LADDER       -> (Fills|Labels) / <Var>.<n> [TierName]            [Var may carry a blend tag]
// `raw` = the exact source substring (prefix stripped). `target` = bold-stripped raw sans "-> " (the string
// the test dedupes on → exactly 29 uniques). `blend` = 'plus-lighter' | 'plus-darker' | undefined.
// ---------------------------------------------------------------------------------------------------------

function detectBlend(name) {
  if (/plus-lighter/.test(name)) return 'plus-lighter';
  if (/plus-darker/.test(name)) return 'plus-darker';
  return undefined;
}

function makeAlias(rawArrow) {
  const raw = rawArrow.trim();
  // target = the bold-stripped, arrow-prefix-stripped path — the string the pinned test dedupes on (→ 29).
  const target = stripBold(raw).replace(/^->\s*/, '').trim();
  return { kind: 'alias', raw, target, aliasRaw: raw, blend: detectBlend(target) };
}

// Find every "-> ..." occurrence inside a single already-annotation-stripped, layer-separated segment. A
// border stroke prefixes the arrow with a (possibly bold) "N px" width — strip it so the arrow starts clean.
function arrowFromSegment(seg) {
  let s = seg.trim().replace(/^(?:\*\*)?\d+(?:\.\d+)?\s*px(?:\*\*)?\s*/, '');
  if (s.startsWith('->')) return s.trim();
  return null;
}

// ---------------------------------------------------------------------------------------------------------
// design-tokens-macos.md resolution index. We build lookup maps from the ladder/system-colour tables so an
// alias resolves to a literal {hex, alpha}. Column headers carry italic-asterisk blend tags → strip them.
// ---------------------------------------------------------------------------------------------------------

// Tag each design-file ladder table with its bucket (fills vs labels) from the nearest preceding heading.
function tagLadderBuckets(designText) {
  const lines = splitLines(designText);
  const tables = extractTables(lines);
  // Map table (by its lineStart) to the most recent "## " top-level heading text.
  let currentTop = '';
  const headingAt = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)$/);
    if (m && !lines[i].startsWith('###')) currentTop = m[1].trim();
    headingAt[i] = currentTop;
  }
  for (const tbl of tables) {
    const top = headingAt[tbl.lineStart] || '';
    if (/^Labels/i.test(top)) tbl._ladderBucket = 'labels';
    else if (/^Fills/i.test(top)) tbl._ladderBucket = 'fills';
  }
  return tables;
}

// ---------------------------------------------------------------------------------------------------------
// The resolver: turn an alias raw string into {hex, alpha} using the design index. Returns null if it cannot
// resolve (the pinned test requires ALL 158 to resolve, i.e. this never returns null on real aliases).
// ---------------------------------------------------------------------------------------------------------

function makeResolver(index) {
  return function resolve(aliasRaw) {
    if (aliasRaw == null) return null;
    let s = stripBold(String(aliasRaw)).replace(/^->\s*/, '').trim();
    // Split on " / " into [group, ...rest]
    const parts = s.split(' / ').map((p) => p.trim());
    const group = parts[0].toLowerCase();

    if (group === 'system colors') {
      // Two shapes: "<Color> (light|dark)" OR "<VariantCol> / <Color>"
      if (parts.length === 2) {
        const m = parts[1].match(/^(.+?)\s*\((light|dark)\)$/i);
        if (!m) return null;
        const color = m[1].trim();
        const appearance = m[2].toLowerCase();
        const entry = index.system[color];
        if (!entry) return null;
        return appearance === 'light' ? entry.light : entry.dark;
      }
      if (parts.length === 3) {
        let variantCol = parts[1];
        const color = parts[2].trim();
        const entry = index.system[color];
        if (!entry) return null;
        // "Dark (plus-lighter)" is the one documented normalization → the "Dark Vibrant (plus-lighter)" column.
        if (/light vibrant/i.test(variantCol) && /plus-darker/i.test(variantCol)) return entry.lightVibrant;
        if (/dark/i.test(variantCol) && /plus-lighter/i.test(variantCol)) return entry.darkVibrant;
        return null;
      }
      return null;
    }

    if (group === 'fills' || group === 'labels') {
      // "<Var>.<n> [TierName]"  Var ∈ Light | Dark | Light Vibrant (plus-darker) | Dark Vibrant (plus-lighter)
      const rest = parts.slice(1).join(' / ');
      const m = rest.match(/^(.+?)\.(\d+)(?:\s+.+)?$/);
      if (!m) return null;
      const varRaw = m[1].trim();
      const tier = m[2];
      let variant;
      const vLower = varRaw.toLowerCase();
      const vibrant = /vibrant/.test(vLower);
      const isLight = /light/.test(vLower);
      const isDark = /dark/.test(vLower);
      if (vibrant && isLight) variant = 'Light Vibrant';
      else if (vibrant && isDark) variant = 'Dark Vibrant';
      else if (isLight) variant = 'Light';
      else if (isDark) variant = 'Dark';
      const store = group === 'labels' ? index.labels : index.fills;
      const entry = store[variant]?.[tier];
      return entry ? { hex: entry.hex, alpha: entry.alpha } : null;
    }

    return null;
  };
}

// ---------------------------------------------------------------------------------------------------------
// Cell classification. `kind`:
//   'key'                  row-key cells (first column) and value-column ENUM cells (Light/Dark/— appearance)
//   'absent'               "—" (U+2014)
//   'equals-content-area'  "= Content Area"
//   'fill'                 one or more colour/alias layers (draw order, layer 0 = bottom)
//   'border'               "N px COLOR/ALIAS" strokes (incl. bold-width focus-ring)
//   'shadow'               "blur N · COLOR · OFFSET · spread N"  OR a "N-layer stack ▼" stackref
//   'numeric'              a lone number / offset pair
//   'unparseable'          nothing matched (must be 0 on the reference files)
// ---------------------------------------------------------------------------------------------------------

const ENUM_KEYS = new Set([
  'Idle', 'Clicked', 'Disabled', 'Focus Ring', 'Light', 'Dark', '(other states)',
  'Centerpoint, Idle', 'Clicked - Glow', 'Clicked - Shadow', 'Color Area Outline', '—',
]);

const NUMERIC_RE = /^[−-]?~?\d+(?:\.\d+)?$/;
const OFFSET_PAIR_RE = /^[−-]?\d+(?:\.\d+)?\s*,\s*[−-]?\d+(?:\.\d+)?$/;
const STACKREF_RE = /^(\d+)-layer stack ▼$/;

// A shadow literal: optional "N layer(s):" prefix, then EXACTLY 4 " · "-separated fields.
function parseShadow(cell) {
  const m = cell.match(/^(?:\d+\s+layers?:\s*)?(.+)$/);
  const body = m ? m[1] : cell;
  const fields = body.split(' · ').map((f) => f.trim());
  if (fields.length !== 4) return null;
  const [blurF, colorF, offsetF, spreadF] = fields;
  if (!/^blur\s/.test(blurF)) return null;
  if (!/^spread\s/.test(spreadF)) return null;
  const color = parseColor(colorF);
  if (!color) return null;
  const blur = Number(blurF.replace(/^blur\s+/, ''));
  const spread = Number(spreadF.replace(/^spread\s+/, '').replace(/−/g, '-'));
  return {
    blur,
    color,
    offset: offsetF,
    spread,
  };
}

// A border cell: gate on / px\b/ (bold widths "**3.5 px**" have no trailing space). Split on ' · '; each
// stroke = "N px COLOR|ALIAS", width may be bold-wrapped.
const BORDER_GATE_RE = / px\b/;
const STROKE_RE = /^(?:\*\*)?(\d+(?:\.\d+)?)\s*px(?:\*\*)?\s+(.+)$/;

function parseBorder(cell) {
  const strokes = [];
  for (const rawSeg of cell.split(' · ')) {
    const seg = rawSeg.trim();
    const m = seg.match(STROKE_RE);
    if (!m) return null;
    const widthPx = Number(m[1]);
    const rest = m[2].trim();
    const color = parseColor(rest);
    const arrow = rest.startsWith('->') ? rest : null;
    if (color) {
      strokes.push({ widthPx, hex: color.hex, alpha: color.alpha });
    } else if (arrow) {
      strokes.push({ widthPx, aliasRaw: arrow, alpha: 1 });
    } else {
      return null;
    }
  }
  return strokes.length ? strokes : null;
}

// A fill cell: split on ' · '; each layer is a COLOR or an ALIAS. Returns layers in draw order or null.
function parseFillLayers(cell) {
  const layers = [];
  for (const rawSeg of cell.split(' · ')) {
    const seg = rawSeg.trim();
    const color = parseColor(seg);
    if (color) {
      layers.push({ hex: color.hex, alpha: color.alpha });
      continue;
    }
    const arrow = arrowFromSegment(seg);
    if (arrow) {
      const alias = makeAlias(arrow);
      layers.push({ aliasRaw: alias.raw, alpha: 1, blend: alias.blend });
      continue;
    }
    return null;
  }
  return layers.length ? layers : null;
}

// ---------------------------------------------------------------------------------------------------------
// The document walker: track H1 context / H2 group / H3 variant|appearance, classify each cell, and record
// its addressing fields so get(context, group, variant, appearance, state) can retrieve it.
// ---------------------------------------------------------------------------------------------------------

const CONTEXT_RE = /^#\s+(CONTENT AREA|OVER-GLASS|GLOBAL LEFTOVERS)$/;
const H2_RE = /^##\s+(.+)$/;
const H3_RE = /^###\s+(.+)$/;

function parseControlDoc(text) {
  const lines = splitLines(text);
  // Pre-index the tables by their starting line so the walker can attach header context.
  const tables = extractTables(lines);
  const tableByStart = new Map(tables.map((t) => [t.lineStart, t]));

  let context = null; // set on first all-caps H1 (the doc-title H1 is skipped)
  let group = null;
  let variant = null;    // H3 numbered button variant OR sub-recipe heading
  let appearance = null; // H3 "Light"/"Dark" when the appearance is carried by the heading (Shape B/C)

  const cells = [];
  const arrows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const ctx = trimmed.match(CONTEXT_RE);
    if (ctx) { context = ctx[1]; group = null; variant = null; appearance = null; continue; }
    if (!context) continue; // skip everything before the first data context (doc title + how-to-read)

    const h2 = line.match(H2_RE);
    if (h2 && !line.startsWith('###')) { group = normalizeGroup(h2[1].trim()); variant = null; appearance = null; continue; }

    const h3 = line.match(H3_RE);
    if (h3) {
      const label = h3[1].trim();
      if (/^Light$/i.test(label)) { appearance = 'Light'; }
      else if (/^Dark$/i.test(label)) { appearance = 'Dark'; }
      else { variant = label; appearance = null; } // numbered variant or sub-recipe (Fills/Shadows/...)
      continue;
    }

    const tbl = tableByStart.get(i);
    if (tbl) {
      // Consume the whole table here; advance i past it so its body lines aren't re-scanned.
      classifyTable(tbl, { context, group, variant, appearance }, cells, arrows);
      i = tbl.lineStart + tbl.rows.length - 1;
      continue;
    }

    // SECTION-LEVEL PROSE RULES — two Over-Glass sections carry their values in prose, not tables. These
    // synthetic cells make those recipes addressable via get() the same as tabled ones. (See the research
    // grammar's SECTION-EQUALITY / SECTION-ABSENT / OG-TOGGLE-PROSE rules.)
    emitProseCells(trimmed, { context, group, variant, appearance }, cells, arrows);
  }

  return { cells, arrows };
}

// The Content-Area Fills ladder shape (6 tiers × Default/Selected) — used to expand an OG "= Content Area"
// section into one equals-content-area cell per Content-Area value cell it stands in for.
const FILLS_TIERS = ['1 Primary', '2 Secondary', '3 Tertiary', '4 Quaternary', '5 Quinary', '6 Seximal'];
const FILLS_LADDERS = ['Default', 'Selected'];
const RECIPE_STATES = ['Idle', 'Clicked', 'Disabled']; // Apple's sparse triple (no 02/hover)
const OG_ABSENT_BUTTON_VARIANTS = ['02 — Bordered Tinted', '03 — Bordered Destructive'];

function emitProseCells(trimmed, addr, cells, arrows) {
  // SECTION-EQUALITY: "**= Content Area**" body line (OG Fills — Default & Selected). Expand to one
  // equals-content-area cell per Content-Area Fills value cell (6 tiers × {Default, Selected}).
  if (/^\*{0,2}=\s*Content Area\*{0,2}\b/.test(trimmed) && addr.group && /^Fills/i.test(addr.group)) {
    for (const ladder of FILLS_LADDERS)
      for (const tier of FILLS_TIERS)
        cells.push({ ...addr, kind: 'equals-content-area', state: tier, rowKey: tier, column: ladder, text: '= Content Area' });
    return;
  }

  // OG-TOGGLE-PROSE: "**Fills = Content Area's Dark 3-layer recipe ...**" — the one value notation the cell
  // grammar cannot express (hex-elided continuation alphas). Transcribed here into explicit fill layers per
  // state × appearance (Idle/Disabled = the 3-layer white stack; Clicked = `#FFFFFF` α0).
  if (/^\*{0,2}Fills = Content Area's Dark 3-layer recipe/i.test(trimmed)) {
    const stack = [
      { hex: '#FFFFFF', alpha: 0.65 },
      { hex: '#FFFFFF', alpha: 0.45 },
      { hex: '#FFFFFF', alpha: 0.35 },
    ];
    const clicked = [{ hex: '#FFFFFF', alpha: 0 }];
    for (const appearance of ['Light', 'Dark'])
      for (const state of RECIPE_STATES) {
        const layers = state === 'Clicked' ? clicked.map((l) => ({ ...l })) : stack.map((l) => ({ ...l }));
        cells.push({ ...addr, kind: 'fill', appearance, state, rowKey: state, column: 'Fills (draw order)', layers });
      }
    return;
  }

  // SECTION-ABSENT: "— *(...)* —" body line. The Over-Glass export omits button variants 02 and 03 entirely
  // (line 299); emit an absent cell per omitted variant × state so get() reports the omission rather than
  // silently returning nothing. (The slider-knob OG absence at line 393 defers to the Content-Area knob and
  // is represented structurally by that section carrying no table.)
  if (/^—\s*\*\(.+\)\*\s*—?$/.test(trimmed) && addr.context === 'OVER-GLASS' && /Bordered/i.test(addr.variant || '')) {
    for (const v of OG_ABSENT_BUTTON_VARIANTS)
      for (const state of RECIPE_STATES)
        cells.push({ ...addr, kind: 'absent', variant: v, group: 'Buttons', state, rowKey: state, column: 'Light', text: '—' });
    return;
  }
}

// H2 group name → a CANONICAL addressing "group". The Content-Area and Over-Glass sections name the same
// control group slightly differently ("Controls (checkbox / radio / switch cell fills)" vs "Controls";
// "Knobs — Toggle (switch thumb)" vs "Knobs — Toggle"; "Segmented Control (Active, On)" vs "Segmented
// Control"; "Tracks (slider / progress groove)" vs "Tracks"; "Fills — Default & Selected (6-tier)" vs
// "Fills — Default & Selected"). Canonicalising lets get() address a group symmetrically across contexts —
// essential for the downstream Over-Glass-vs-Content-Area delta diff.
function normalizeGroup(h2) {
  const base = h2.replace(/\s*\(.*\)\s*$/, '').trim(); // drop a trailing "(...)" qualifier
  if (/^Buttons/i.test(base)) return 'Buttons';
  if (/^Controls/i.test(base)) return 'Controls';
  if (/^Fills/i.test(base)) return 'Fills';
  if (/^Knobs — Toggle/i.test(base)) return 'Knobs — Toggle';
  if (/^Knobs — Sliders/i.test(base)) return 'Knobs — Sliders';
  if (/^Segmented Control/i.test(base)) return 'Segmented Control';
  if (/^Tracks/i.test(base)) return 'Tracks';
  return base;
}

// The header shape tells us how Light/Dark and the state axis are carried. We dispatch on the header row.
function classifyTable(tbl, addr, cells, arrows) {
  const header = tbl.rows[0];
  const data = tbl.rows.slice(2);
  const h = header.map((s) => s.trim());

  // Column roles: find an explicit "Appearance" column and the value columns that are per-appearance.
  const appearanceCol = h.findIndex((x) => /^Appearance$/i.test(x));
  // Shape A/tick/segmented: header "... | Light | Dark" → appearance is the COLUMN.
  const lightCol = h.findIndex((x) => /^Light$/i.test(x));
  const darkCol = h.findIndex((x) => /^Dark$/i.test(x));

  for (const row of data) {
    const rowKey = (row[0] ?? '').trim();
    // Row-key cell → kind 'key'
    cells.push({ ...addr, kind: 'key', rowKey, text: rowKey, column: h[0] });

    for (let ci = 1; ci < row.length; ci++) {
      const rawCell = (row[ci] ?? '').trim();
      const columnName = h[ci] ?? '';

      // Determine the appearance this value cell belongs to.
      let cellAppearance = addr.appearance;
      if (ci === lightCol) cellAppearance = 'Light';
      else if (ci === darkCol) cellAppearance = 'Dark';
      else if (appearanceCol >= 0) cellAppearance = (row[appearanceCol] ?? '').trim(); // Shape C explicit column

      // Determine the state this value cell belongs to.
      // Shape A/tick/segmented: state = rowKey; value columns are Light/Dark.
      // Shape B/tracks/controls: state = the value column header (Idle/Clicked/Disabled); rowKey = activation,value.
      // Shape C: state = rowKey; other columns are Appearance/Fill/Border/Shadow value columns.
      let state;
      if (ci === lightCol || ci === darkCol) state = rowKey;
      else if (/^(Idle|Clicked|Disabled|Focus Ring)$/i.test(columnName)) state = columnName;
      else state = rowKey;

      const cell = classifyCell(rawCell, {
        ...addr,
        appearance: cellAppearance,
        state,
        rowKey,
        column: columnName,
      }, arrows);
      cells.push(cell);
    }
  }
}

function classifyCell(rawCell, addr, arrows) {
  const base = { ...addr, text: rawCell };

  // 1. ABSENT
  if (/^—$/.test(rawCell)) return { ...base, kind: 'absent' };

  // 2. EQUALITY
  if (/^\*{0,2}=\s*Content Area\*{0,2}$/.test(rawCell)) return { ...base, kind: 'equals-content-area' };

  // 3. Value-column ENUM (Shape C "Appearance" column: Light | Dark, and other bare enum tokens that appear
  //    in a value position). These carry no colour — the research groups them with row keys as "key/enum",
  //    so kind:'key' (they are addressing/label cells, never fills).
  if (ENUM_KEYS.has(rawCell)) return { ...base, kind: 'key' };

  // Strip a trailing italic annotation before layer/stack parsing (the annotation may hold a shadow recipe;
  // we keep the full text on the cell for downstream, but split on the stripped body).
  const body = stripAnnotation(rawCell);

  // 4. STACKREF ("6-layer stack ▼") → a shadow reference.
  const stackM = body.match(STACKREF_RE);
  if (stackM) return { ...base, kind: 'shadow', stackRef: Number(stackM[1]) };

  // 5. NUMERIC (lone number or offset pair).
  if (NUMERIC_RE.test(body) || OFFSET_PAIR_RE.test(body)) return { ...base, kind: 'numeric', value: body };

  // 6. SHADOW literal (4 " · " fields, blur.../spread...).
  const shadow = parseShadow(body);
  if (shadow) return { ...base, kind: 'shadow', ...shadow };

  // 7. BORDER (gate on / px\b/).
  if (BORDER_GATE_RE.test(body)) {
    const strokes = parseBorder(body);
    if (strokes) {
      for (const s of strokes) if (s.aliasRaw) arrows.push(makeAlias(s.aliasRaw));
      return { ...base, kind: 'border', strokes };
    }
  }

  // 8. FILL LAYERS (colour/alias, draw order).
  const layers = parseFillLayers(body);
  if (layers) {
    for (const l of layers) if (l.aliasRaw) arrows.push(makeAlias(l.aliasRaw));
    return { ...base, kind: 'fill', layers };
  }

  return { ...base, kind: 'unparseable' };
}

// ---------------------------------------------------------------------------------------------------------
// Prose arrows: the "how to read" intro (before the first data context) shows 2 example aliases inside
// backticks. The pinned count of 158 arrows includes these 2. Collect them so arrows.length === 158.
// ---------------------------------------------------------------------------------------------------------

function collectProseArrows(text) {
  const lines = splitLines(text);
  const out = [];
  let inData = false;
  for (const line of lines) {
    if (CONTEXT_RE.test(line.trim())) inData = true;
    if (inData) continue; // only the intro prose (before the first data H1) contributes example arrows
    if (line.trim().startsWith('|')) continue;
    const re = /`(->[^`]+)`/g;
    let m;
    while ((m = re.exec(line)) !== null) out.push(makeAlias(m[1].trim()));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------------------

export function parseRecipes({ controlTokensText, designTokensText }) {
  // Build the design-file resolution index: extract + heading-tag the ladders ONCE, then index them (so the
  // fills-vs-labels bucket tags survive into the indexer).
  const taggedTables = tagLadderBuckets(designTokensText);
  const index = buildDesignIndexFromTables(taggedTables);
  const resolve = makeResolver(index);

  const { cells, arrows: cellArrows } = parseControlDoc(controlTokensText);
  const proseArrows = collectProseArrows(controlTokensText);
  const arrows = [...cellArrows, ...proseArrows];

  const tables = extractTables(splitLines(controlTokensText));

  // Address index for get(). Key on the addressing fields; a cell may match multiple states/appearances.
  function get(context, group, variant, appearance, state) {
    return cells.filter((c) =>
      c.kind !== 'key' &&
      eqOrAny(c.context, context) &&
      eqOrAny(c.group, group) &&
      eqOrAny(c.variant, variant) &&
      eqOrAny(c.appearance, appearance) &&
      eqOrAny(c.state, state));
  }

  return { tables, cells, arrows, resolve, get };
}

// A design-index builder that consumes already-extracted+tagged tables (avoids a second extraction that
// would drop the _ladderBucket tags).
function buildDesignIndexFromTables(tables) {
  const cleanHeader = (h) => stripBold(h).replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const index = { system: {}, fills: {}, labels: {} };

  const parseAlphaCell = (cell, baseHex) => {
    const asColor = parseColor(cell);
    if (asColor) return asColor;
    const num = cell.trim().match(/^(\d+(?:\.\d+)?)$/);
    if (num) return { hex: baseHex, alpha: Number(num[1]) };
    return null;
  };

  for (const tbl of tables) {
    const header = tbl.rows[0].map(cleanHeader);
    const data = tbl.rows.slice(2);
    const h0 = header[0];

    if (h0 === '#' && header[1] === 'Color') {
      for (const r of data) {
        const name = r[1];
        const col = (i) => parseColor(r[i]) || null;
        index.system[name] = { light: col(2), dark: col(3), lightVibrant: col(4), darkVibrant: col(5) };
      }
      continue;
    }

    if (h0 === 'Tier' && tbl._ladderBucket) {
      const store = tbl._ladderBucket === 'labels' ? index.labels : index.fills;
      const cols = header.slice(1).map((hh) => {
        const baseHexMatch = hh.match(/#([0-9A-Fa-f]{6})/);
        const hLower = hh.toLowerCase();
        const vibrant = /vibrant/.test(hLower);
        const isLight = /light/.test(hLower);
        const isDark = /dark/.test(hLower);
        let variant;
        if (vibrant && isLight) variant = 'Light Vibrant';
        else if (vibrant && isDark) variant = 'Dark Vibrant';
        else if (isLight) variant = 'Light';
        else if (isDark) variant = 'Dark';
        const impliedBase = baseHexMatch ? '#' + baseHexMatch[1] : (isLight ? '#000000' : '#FFFFFF');
        return { variant, baseHex: impliedBase };
      });
      for (const r of data) {
        const tierNum = r[0].match(/^(\d+)/)?.[1];
        if (!tierNum) continue;
        for (let ci = 1; ci < r.length; ci++) {
          const col = cols[ci - 1];
          if (!col || !col.variant) continue;
          const val = parseAlphaCell(r[ci], col.baseHex);
          if (!val) continue;
          (store[col.variant] ??= {})[tierNum] = val;
        }
      }
    }
  }
  return index;
}

const eqOrAny = (have, want) => want === undefined || want === null || have === want;
