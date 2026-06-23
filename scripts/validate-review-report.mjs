// Dependency-free enforcement of the design-review report contract + honesty invariants.
// Contract: data/schema/design-review-report.schema.json. Consumed by the SP-D benchmark
// and (later) any commit gate. See specs/2026-06-17-design-spA-reviewer-v2-design.md.
export const SCOPES = ['element', 'component', 'screen', 'flow'];
export const LEVELS = ['static', 'visual', 'full'];
export const VERDICTS = ['verified-pass', 'advisory-pass', 'fail', 'incomplete'];
export const CATEGORIES = ['hierarchy', 'task-fit', 'ia', 'state', 'error-recovery',
  'accessibility', 'visual', 'interaction', 'platform-fit', 'content'];
export const AUTHORITIES = ['apple_published', 'platform_api_observed', 'wcag_external',
  'project_recommendation', 'community_convention', 'inference'];
export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'advisory'];
export const CONFIDENCES = ['high', 'medium', 'low'];
export const EVIDENCE = ['static-code', 'computed', 'screenshot', 'a11y-tree', 'inferred'];

const FINDING_REQUIRED = ['id', 'ruleId', 'category', 'authority', 'severity', 'confidence',
  'evidence', 'location', 'problem', 'userImpact', 'fix', 'howToVerify'];
const ENUM = { category: CATEGORIES, authority: AUTHORITIES, severity: SEVERITIES,
  confidence: CONFIDENCES, evidence: EVIDENCE };

export function validateReport(report) {
  const errors = [];
  const e = (m) => errors.push(m);
  if (report == null || typeof report !== 'object') return { valid: false, errors: ['report must be an object'] };
  if (report.schema !== 1) e('schema must be 1');
  if (!SCOPES.includes(report.scope)) e(`scope must be one of ${SCOPES.join('|')}`);
  if (!LEVELS.includes(report.level)) e(`level must be one of ${LEVELS.join('|')}`);
  if (!VERDICTS.includes(report.verdict)) e(`verdict must be one of ${VERDICTS.join('|')}`);
  if (!Array.isArray(report.findings)) e('findings must be an array');

  const findings = Array.isArray(report.findings) ? report.findings : [];
  findings.forEach((f, i) => {
    if (f == null || typeof f !== 'object') { e(`findings[${i}] must be an object`); return; }
    for (const k of FINDING_REQUIRED) {
      const v = f[k];
      if (v === undefined || v === null || v === '') e(`findings[${i}].${k} is required`);
    }
    for (const [k, allowed] of Object.entries(ENUM)) {
      if (f[k] !== undefined && !allowed.includes(f[k])) e(`findings[${i}].${k} invalid: ${f[k]}`);
    }
  });

  // Invariant A: a static-only review cannot be verified.
  if (report.verdict === 'verified-pass' && report.level === 'static')
    e('verified-pass is not allowed at level=static (a static-only review cannot be verified)');

  // Invariant B: the blocking rule — critical/high at confidence>=medium must drive fail, and only then.
  const blocking = findings.some(
    (f) => ['critical', 'high'].includes(f.severity) && ['high', 'medium'].includes(f.confidence));
  if (blocking && report.verdict !== 'fail')
    e('a critical/high finding at confidence>=medium requires verdict=fail');
  if (!blocking && report.verdict === 'fail')
    e('verdict=fail requires at least one critical/high finding at confidence>=medium');

  return { valid: errors.length === 0, errors };
}
