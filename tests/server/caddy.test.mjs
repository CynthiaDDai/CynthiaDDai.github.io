import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';

test('the NixOS module serves static routes, assets, and real 404s through Caddy', { timeout: 30000 }, async () => {
  const config = JSON.parse(execFileSync('nix-instantiate', ['--eval', '--strict', '--json', 'tests/nix/module.nix'], { encoding: 'utf8' }));
  assert.equal(config.publicUrl, 'https://website.example');
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const directory = await mkdtemp(join(tmpdir(), 'terminal-website-caddy-'));
  const file = join(directory, 'Caddyfile');
  const root = resolve('dist');
  const caddyConfig = config.caddyConfig.replaceAll(`${config.sitePackage}/share/terminal-website`, `"${root}"`);
  await writeFile(file, `{\n admin off\n auto_https off\n}\nhttp://127.0.0.1:${port} {\n${caddyConfig}\n}\n`);
  let logs = '';
  const server = spawn('caddy', ['run', '--config', file, '--adapter', 'caddyfile'], {
    env: { ...process.env, XDG_DATA_HOME: join(directory, 'data'), XDG_CONFIG_HOME: join(directory, 'config') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', output => { logs += output; });
  server.stderr.on('data', output => { logs += output; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base)).ok; } catch { /* Wait for listener. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(ready, logs);
    // Every built page of whatever content is in dist/, plus the feeds.
    const pages = (await readdir(root, { recursive: true })).filter(file => file.endsWith('index.html'))
      .map(file => '/' + file.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, ''));
    assert.ok(pages.length > 1, 'dist/ contains built pages');
    for (const path of [...pages, '/rss.xml', '/sitemap.xml']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.equal(response.redirected, false, `Canonical path should not redirect: ${path}`);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    }
    const missing = await fetch(base + '/missing-page');
    assert.equal(missing.status, 404);
    const profile = JSON.parse(await readFile('src/config/site.json', 'utf8'));
    assert.ok((await missing.text()).includes(profile.notFound.title));
    const asset = (await readdir(join(root, '_astro'))).find(name => name.endsWith('.js'));
    assert.ok(asset, 'Built JavaScript asset exists');
    const assetResponse = await fetch(`${base}/_astro/${asset}`);
    assert.equal(assetResponse.status, 200);
    assert.equal(assetResponse.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const fontResponse = await fetch(`${base}/fonts/nerd-symbols-mono.woff2`);
    assert.equal(fontResponse.status, 200);
    assert.match(fontResponse.headers.get('content-type'), /^font\/woff2/);
    assert.equal(Buffer.from(await fontResponse.arrayBuffer()).subarray(0, 4).toString(), 'wOF2');
  } finally {
    if (server.exitCode === null) {
      server.kill('SIGTERM');
      await new Promise(resolve => server.once('exit', resolve));
    }
    await rm(directory, { recursive: true, force: true });
  }
});
