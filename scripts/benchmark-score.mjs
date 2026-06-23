// Design-benchmark scorer (dependency-free, pure functions).
// Scores a design-reviewer run against a fixture's seeded ground truth.
//
//   actual   = { verdict, categories: [<finding category>...], flags: [<descriptive rule tag>...] }
//   expected = { expectedVerdict, expectedCategories: [...], mustNotFlag: [...] }
//
// recall      = expected categories the reviewer flagged
// falsePos    = must-not-flag rules the reviewer raised (substring match against flags)
// The Workflow runner (.claude/workflows/design-benchmark) maps the reviewer's HIG-VERDICT line +
// findings into `actual`, then feeds the results here. See specs/2026-06-17-design-spD-benchmark.md.

export function scoreFixture(actual, expected) {
  const found = new Set(actual?.categories || []);
  const flags = actual?.flags || [];
  const exp = expected?.expectedCategories || [];
  const mustNot = expected?.mustNotFlag || [];

  const truePositives = exp.filter((c) => found.has(c));
  const falseNegatives = exp.filter((c) => !found.has(c));
  // a false positive = a must-not-flag rule the reviewer actually raised (match if any flag mentions it)
  const falsePositives = mustNot.filter((m) => flags.some((f) => String(f).includes(m)));
  const verdictMatch = actual?.verdict === expected?.expectedVerdict;

  return { verdictMatch, truePositives, falseNegatives, falsePositives };
}

export function aggregate(results) {
  let tp = 0, fn = 0, fp = 0, verdictHits = 0;
  for (const r of results) {
    tp += r.truePositives.length;
    fn += r.falseNegatives.length;
    fp += r.falsePositives.length;
    if (r.verdictMatch) verdictHits++;
  }
  return {
    precision: tp + fp ? tp / (tp + fp) : 1,
    recall: tp + fn ? tp / (tp + fn) : 1,
    verdictAccuracy: results.length ? verdictHits / results.length : 1,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    fixtures: results.length,
  };
}
