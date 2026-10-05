import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/new-page');
const run = (cwd, ...args) => spawnSync('/bin/sh', [script, ...args], { cwd, encoding: 'utf8' });
const fields = text => { const lines = text.split('\n'); return lines.slice(2, lines.indexOf('---', 1)); };
// What the author does: delete the leading # of every field.
const uncomment = text => text.replace(/^# Optional.*\n/m, '').replace(/^# /gm, '');

test('new-page writes a page with every field as a comment, and a section page with the fields for a folder', () => {
  const root = mkdtempSync(join(tmpdir(), 'new-page-'));
  try {
    const site = join(root, 'site');
    mkdirSync(join(site, 'src/content/talks'), { recursive: true });

    assert.equal(run(site, 'src/content/talks/index.md').status, 0);
    const section = readFileSync(join(site, 'src/content/talks/index.md'), 'utf8');
    assert.match(section, /^---\ntitle: talks\n/);
    assert.ok(fields(section).every(line => line.startsWith('#')), section);
    assert.match(section, /^# groups: +# /m);
    assert.doesNotMatch(section, /^# date:/m);

    // The folder's statuses are read from its index.md, even with a comment after `groups:`.
    writeFileSync(join(site, 'src/content/talks/index.md'), uncomment(section));
    assert.equal(run(join(site, 'src/content/talks'), 'first-talk.md').status, 0);
    const page = readFileSync(join(site, 'src/content/talks/first-talk.md'), 'utf8');
    assert.match(page, /^---\ntitle: first-talk\n/);
    assert.ok(fields(page).every(line => line.startsWith('#')), page);
    assert.match(page, /^# status: Lectures +# required in this folder: one of Lectures, Expositions$/m);
    assert.match(page, /^# date: \d{4}-\d{2}-\d{2} +# /m);

    writeFileSync(join(site, 'src/content/talks/first-talk.md'), 'edited');
    const refusals = [
      [['src/content/talks/first-talk.md'], /already exists/],
      [['src/content/talks'], /is a folder; name the page/],
      [['src/content/talks/notes.txt'], /must end in \.md/],
      [['src/content/none/page.md'], /no such folder/],
      [['page.md'], /not under src\/content\//],
      [[], /usage/],
    ];
    for (const [args, message] of refusals) {
      const result = run(site, ...args);
      assert.notEqual(result.status, 0, args.join(' '));
      assert.match(result.stderr, message);
    }
    assert.equal(readFileSync(join(site, 'src/content/talks/first-talk.md'), 'utf8'), 'edited');
    assert.equal(existsSync(join(site, 'page.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
