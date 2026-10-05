import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/cp-pdf');
const run = (cwd, ...args) => spawnSync('/bin/sh', [script, ...args], { cwd, encoding: 'utf8' });

test('cp-pdf writes a page for a public file, named like cp, and never overwrites', () => {
  const root = mkdtempSync(join(tmpdir(), 'cp-pdf-'));
  try {
    const site = join(root, 'site');
    mkdirSync(join(site, 'public/notes'), { recursive: true });
    mkdirSync(join(site, 'src/content/notes'), { recursive: true });
    writeFileSync(join(site, 'public/notes/stacks.pdf'), '');
    writeFileSync(join(site, 'public/notes/main.pdf'), '');
    writeFileSync(join(root, 'outside.pdf'), '');

    writeFileSync(join(site, 'src/content/notes/index.md'), '---\ntitle: Notes\ngroups:\n  Lectures: Lecture Notes\n  Expositions: Expositions\nmotto: 寻章摘句\n---\n');
    // A folder keeps the file's name; a .md path renames it. Paths are relative to where it runs.
    assert.equal(run(site, 'public/notes/stacks.pdf', 'src/content/notes/').status, 0);
    const page = readFileSync(join(site, 'src/content/notes/stacks.md'), 'utf8').split('\n');
    assert.deepEqual(page.slice(0, 3), ['---', 'title: stacks', 'file: /notes/stacks.pdf']);
    // Every other field is a comment, so an unfilled one cannot break the build; the folder's statuses are listed.
    const fields = page.slice(3, page.indexOf('---', 1));
    assert.ok(fields.every(line => line.startsWith('# ')), fields.join('\n'));
    assert.ok(fields.some(line => /^# status: Lectures +# required in this folder: one of Lectures, Expositions$/.test(line)), fields.join('\n'));
    assert.ok(fields.some(line => /^# date: \d{4}-\d{2}-\d{2} +# /.test(line)), fields.join('\n'));
    assert.equal(run(join(site, 'src/content/notes'), '../../../public/notes/main.pdf', 'algebraic-stacks.md').status, 0);
    assert.match(readFileSync(join(site, 'src/content/notes/algebraic-stacks.md'), 'utf8'), /^file: \/notes\/main\.pdf$/m);

    writeFileSync(join(site, 'src/content/notes/stacks.md'), 'edited');
    const refusals = [
      [['public/notes/stacks.pdf', 'src/content/notes/'], /already exists/],
      [['../outside.pdf', 'src/content/notes/outside.md'], /not under .*\/public\//],
      [['public/notes/none.pdf', 'src/content/notes/'], /no such file/],
      [['public/notes/main.pdf', 'src/content/notes/main.txt'], /must be a \.md file or a folder/],
      [['public/notes/main.pdf', 'public/main.md'], /not under src\/content\//],
      [['public/notes/main.pdf'], /usage/],
    ];
    for (const [args, message] of refusals) {
      const result = run(site, ...args);
      assert.notEqual(result.status, 0, args.join(' '));
      assert.match(result.stderr, message);
    }
    assert.equal(readFileSync(join(site, 'src/content/notes/stacks.md'), 'utf8'), 'edited');
    assert.equal(existsSync(join(site, 'src/content/notes/outside.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
