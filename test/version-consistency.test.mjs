import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const j = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('all four manifest version strings are identical — no partial bump can ship', () => {
  const plugin = j('.claude-plugin/plugin.json').version;
  const pkg = j('package.json').version;
  const mkt = j('.claude-plugin/marketplace.json');
  assert.ok(plugin, 'plugin.json has a version');
  assert.match(plugin, /^\d+\.\d+\.\d+$/, 'semver');
  assert.equal(pkg, plugin, 'package.json version matches plugin.json');
  assert.equal(mkt.metadata?.version, plugin, 'marketplace metadata.version matches plugin.json');
  assert.equal(mkt.plugins?.[0]?.version, plugin, 'marketplace plugins[0].version matches plugin.json');
});

test('every shipped command is documented in the README and the site', () => {
  const cmds = readdirSync(new URL('commands/', root)).filter((f) => f.endsWith('.md')).map((f) => '/' + f.replace(/\.md$/, ''));
  assert.ok(cmds.length >= 3, `expected the command set, found ${cmds.length}`);
  const readme = read('README.md');
  const site = read('docs/index.html');
  for (const c of cmds) {
    assert.ok(readme.includes(c), `README does not document ${c}`);
    assert.ok(site.includes(c), `docs/index.html does not document ${c}`);
  }
});
