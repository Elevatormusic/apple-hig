export const meta = {
  name: 'design-benchmark',
  description: 'Run the apple-hig design-reviewer against the seeded fixtures and score precision/recall + an Opus judge-panel proxy',
  phases: [
    { title: 'Review', detail: 'run the design-reviewer on each fixture' },
    { title: 'Judge', detail: 'Opus judge-panel rates each reviewer run (expert proxy)' },
  ],
}

// Seeded ground truth — kept in sync with apple-hig/test/fixtures/design/expected.json.
const REPO = 'apple-hig';
const FIXTURES = [
  { file: 'perfect-tokens-wrong-hierarchy.html', summary: 'Correct tokens but broken hierarchy: two co-equal primary buttons, metadata louder than the title, a buried "Payment failed" status.', expectedVerdict: 'fail', expectedCategories: ['hierarchy', 'visual'], mustNotFlag: ['off-grid-spacing', 'hardcoded-color'] },
  { file: 'monitoring-no-cta.html', summary: 'An informational system-status board; correct precisely because it has no primary CTA.', expectedVerdict: 'advisory-pass', expectedCategories: [], mustNotFlag: ['missing-primary-action'] },
  { file: 'good-ios-settings.html', summary: 'A clean, correct iOS grouped-settings screen (semantic colors, dark mode, clear title, 44pt rows). A true negative — nothing to flag.', expectedVerdict: 'advisory-pass', expectedCategories: [], mustNotFlag: ['off-grid-spacing', 'hardcoded-color', 'contrast', 'missing-label', 'missing-primary-action'] },
  { file: 'hidden-critical-warning.html', summary: 'A delete-account screen where the irreversible consequence is tiny/faint and the destructive action is styled as a calm prominent primary.', expectedVerdict: 'fail', expectedCategories: ['error-recovery', 'hierarchy'], mustNotFlag: [] },
  { file: 'macos-dense-inspector.html', summary: 'macOS inspector — dense is idiomatic (no single CTA, ~28pt controls); must NOT be flagged as cluttered/sub-44pt/missing-CTA.', expectedVerdict: 'advisory-pass', expectedCategories: [], mustNotFlag: ['density', 'clutter', 'too-many-controls', 'missing-primary-action', 'small-target', 'off-grid-spacing'] },
  { file: 'ipad-stretched-iphone.html', summary: 'iPad regular width but a stretched iPhone (narrow column, dead margins); must RAISE platform-fit.', expectedVerdict: 'advisory-pass', expectedCategories: ['platform-fit'], mustNotFlag: [] },
  { file: 'good-web-dashboard.html', summary: 'Correct desktop-web dashboard (web-native nav, no iOS chrome); must NOT be flagged for lacking iOS chrome/tab-bar/SF-Symbols.', expectedVerdict: 'advisory-pass', expectedCategories: [], mustNotFlag: ['missing-ios-chrome', 'no-tab-bar', 'no-sf-symbols', 'missing-primary-action'] },
  { file: 'all-cards-fragmented.html', summary: 'Card overload — every field in its own shadowed card; must RAISE visual (medium, verdict stays advisory-pass).', expectedVerdict: 'advisory-pass', expectedCategories: ['visual'], mustNotFlag: [] },
  { file: 'error-without-recovery.html', summary: 'Payment error with no cause/retry and wiped fields; must fail on error-recovery.', expectedVerdict: 'fail', expectedCategories: ['error-recovery'], mustNotFlag: [] },
]

// Inlined twin of scripts/benchmark-score.mjs (the Workflow sandbox can't import it).
function scoreFixture(actual, expected) {
  const found = new Set(actual?.categories || []);
  const flags = actual?.flags || [];
  const truePositives = expected.expectedCategories.filter((c) => found.has(c));
  const falseNegatives = expected.expectedCategories.filter((c) => !found.has(c));
  const falsePositives = expected.mustNotFlag.filter((m) => flags.some((f) => String(f).includes(m)));
  return { verdictMatch: actual?.verdict === expected.expectedVerdict, truePositives, falseNegatives, falsePositives };
}
// Run-to-run consistency for ONE fixture's repeated runs: the modal-verdict fraction (1.0 = all agreed).
function consistency(runs) {
  if (!runs || !runs.length) return 1;
  const counts = {};
  for (const r of runs) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  return Math.max(...Object.values(counts)) / runs.length;
}

const ACTUAL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['verified-pass', 'advisory-pass', 'fail', 'incomplete'] },
    categories: { type: 'array', items: { type: 'string' } },
    flags: { type: 'array', items: { type: 'string' }, description: 'short tags for each rule raised, e.g. "off-grid-spacing 13px", "competing-primary"' },
    level: { type: 'string', enum: ['static', 'visual', 'full'] },
    notes: { type: 'string' },
  },
  required: ['verdict', 'categories', 'flags', 'level'],
}
const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { agree: { type: 'boolean' }, reason: { type: 'string' } }, required: ['agree', 'reason'],
}

// Capability-gated: pass {rendered:true, repoAbs:"<ABSOLUTE path to the apple-hig repo>"} to render each
// fixture via the Playwright `browser_*` tools. Caveats: rendered mode needs the Playwright MCP available
// to workflow agents; `repoAbs` must be absolute (Windows paths are normalised to a file:// URL below);
// and `level` is self-reported by the agent (not proven against actual screenshots) — so for a stable,
// comparable score prefer the default static path; use rendered for a thorough spot-check.
const rendered = !!(args && args.rendered)
const repeats = Math.max(1, (args && args.repeats) || 1)   // pass {repeats:3} to measure consistency
const repoAbs = (args && args.repoAbs) || ''
// Normalise an absolute OS path to a file:// URL base (C:\a\b -> file:///C:/a/b; /a/b -> file:///a/b).
const fileBase = repoAbs ? 'file://' + (repoAbs.startsWith('/') ? '' : '/') + repoAbs.replace(/\\/g, '/') : ''
const GUARDS = `Apply the method honestly — establish the task, judge the visual/task hierarchy, states, and accessibility; respect the false-positive guards (don't flag decorative/disabled/logotype contrast, off-grid numbers alone, brand colors with paired light+dark, or a missing CTA on a monitoring screen). Return ONLY: the \`verdict\`, the finding \`categories\` you raised (hierarchy|task-fit|ia|state|error-recovery|accessibility|visual|interaction|platform-fit|content), \`flags\` (a short tag per rule), and \`level\`. Do NOT read expected.json or any answer key.`
const staticPrompt = (fx) =>
  `Act as the apple-hig design-reviewer. First Read \`${REPO}/agents/design-reviewer.md\` (the staged method + contrast-role table + verdict rules). Then Read the fixture \`${REPO}/test/fixtures/design/${fx.file}\` and review at scope=screen, level=static (no renderer available). ${GUARDS}`
const renderedPrompt = (fx) =>
  `Act as the apple-hig design-reviewer with RENDERED verification. Read \`${REPO}/agents/design-reviewer.md\` for the method, then RENDER the fixture with the Playwright \`browser_*\` tools (load them via tool search if needed): \`browser_navigate\` to \`${fileBase}/test/fixtures/design/${fx.file}\`; \`browser_resize\` for a LIGHT and a DARK pass and a narrow (~390) and wide (~1280) pass; \`browser_take_screenshot\` each. Verify against the ACTUAL rendered pixels — real contrast on the rendered background, target geometry after layout, and the hierarchy (squint/blur: which element dominates the screen?). Review at scope=screen, level=visual. ${GUARDS}`

phase('Review')
let reviews
if (rendered) {
  if (!repoAbs) throw new Error('rendered:true requires repoAbs (an absolute path to the apple-hig repo) to build the file:// URLs')
  // sequential — one browser at a time, to avoid Playwright-profile contention across agents
  reviews = []
  for (const fx of FIXTURES) {
    const actual = await agent(renderedPrompt(fx), { label: `render:${fx.file}`, phase: 'Review', schema: ACTUAL_SCHEMA })
    reviews.push({ fx, actual, score: actual ? scoreFixture(actual, fx) : null })
  }
} else {
  // run each fixture `repeats` times (parallel); score the first run, keep all for the consistency metric
  const flat = await parallel(FIXTURES.flatMap((fx) =>
    Array.from({ length: repeats }, (_, k) => () =>
      agent(staticPrompt(fx), { label: `review:${fx.file}${repeats > 1 ? '#' + (k + 1) : ''}`, phase: 'Review', schema: ACTUAL_SCHEMA })
        .then((actual) => ({ fx, actual })))))
  reviews = FIXTURES.map((fx) => {
    const runs = flat.filter((r) => r && r.fx === fx && r.actual).map((r) => r.actual)
    return { fx, actual: runs[0] || null, score: runs[0] ? scoreFixture(runs[0], fx) : null, runs }
  })
}

const scored = reviews.filter((r) => r && r.score)
const agg = scored.reduce((a, r) => {
  a.tp += r.score.truePositives.length; a.fn += r.score.falseNegatives.length;
  a.fp += r.score.falsePositives.length; a.verdictHits += r.score.verdictMatch ? 1 : 0; return a
}, { tp: 0, fn: 0, fp: 0, verdictHits: 0 })
const aggregate = {
  precision: agg.tp + agg.fp ? agg.tp / (agg.tp + agg.fp) : 1,
  recall: agg.tp + agg.fn ? agg.tp / (agg.tp + agg.fn) : 1,
  verdictAccuracy: scored.length ? agg.verdictHits / scored.length : 1,
  falsePositives: agg.fp, falseNegatives: agg.fn, fixtures: scored.length,
}
log(`Reviewed ${scored.length}/${FIXTURES.length} fixtures — verdict accuracy ${(aggregate.verdictAccuracy * 100).toFixed(0)}%, precision ${(aggregate.precision * 100).toFixed(0)}%, recall ${(aggregate.recall * 100).toFixed(0)}%`)

phase('Judge')
// Opus judge-panel proxy: 3 judges per fixture rate whether the reviewer got it right. Honestly LABELLED
// a proxy for expert agreement (an LLM judging an LLM), not human ground truth.
const judged = await parallel(scored.map((r) => () =>
  parallel([0, 1, 2].map((j) => () =>
    agent(
      `A design fixture's true nature: "${r.fx.summary}". The expected verdict is "${r.fx.expectedVerdict}". The apple-hig design-reviewer returned verdict="${r.actual.verdict}" with finding categories [${r.actual.categories.join(', ')}] and flags [${r.actual.flags.join(', ')}]. As an independent design-review judge (lens ${j === 0 ? 'task/hierarchy' : j === 1 ? 'accessibility/states' : 'false-positive discipline'}): did the reviewer get this RIGHT — correct verdict, caught the real problem, and did not raise a spurious flag? Return {agree, reason}.`,
      { label: `judge:${r.fx.file}:${j}`, phase: 'Judge', schema: JUDGE_SCHEMA },
    )))
    .then((votes) => {
      const yes = votes.filter(Boolean).filter((v) => v.agree).length
      return { file: r.fx.file, expertAgree: yes >= 2, votes: yes }
    })
))

const judgeAgreement = judged.length ? judged.filter((j) => j.expertAgree).length / judged.length : 1
const runsOf = (r) => (r.runs && r.runs.length) ? r.runs : (r.actual ? [r.actual] : []);
const consistencyReport = repeats > 1
  ? { repeats, agreement: reviews.length ? reviews.reduce((s, r) => s + consistency(runsOf(r)), 0) / reviews.length : 1,
      perFixture: reviews.map((r) => ({ file: r.fx.file, verdicts: runsOf(r).map((x) => x.verdict) })) }
  : { repeats: 1, note: 'pass {repeats:N} (e.g. 3) to measure run-to-run consistency / over-flagging variance' };
return {
  perFixture: scored.map((r) => ({ file: r.fx.file, expectedVerdict: r.fx.expectedVerdict, verdict: r.actual.verdict, categories: r.actual.categories, score: r.score })),
  aggregate,
  consistency: consistencyReport,
  judgePanel: { agreement: judgeAgreement, note: 'Opus judge-panel proxy (LLM-judges-LLM), NOT human ground truth', perFixture: judged },
}
