import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { themeCatalogPlugin } from '../../scripts/theme-discovery.mjs';

test('dev watches optional companions appearing, changing, disappearing and falling back', async ({ page }) => {
  const root = mkdtempSync(join(tmpdir(), 'theme-watcher-'));
  mkdirSync(join(root, 'src/themes/a'), { recursive: true });
  mkdirSync(join(root, 'src/config'), { recursive: true });
  const settingsPath = join(root, 'src/config/themes.json');
  writeFileSync(settingsPath, JSON.stringify({ fallback: { web: { name: 'Fallback' } } }));
  writeFileSync(join(root, 'src/themes/a/native.omp.json'), '{"blocks":[]}');
  writeFileSync(join(root, 'index.html'), `<div id="name"></div><div id="diagnostic"></div><script type="module">
    import catalog from 'virtual:site-themes';
    const key = '/themes/a/native.omp.json';
    document.querySelector('#name').textContent = catalog.overrides[key]?.name || catalog.settings.fallback.web.name;
    document.querySelector('#diagnostic').textContent = (catalog.warnings[key] || []).join(' ');
  </script>`);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const server = await createServer({ root, configFile: false, plugins: [themeCatalogPlugin()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  try {
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === 'string') throw new Error('No test server port.');
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await expect(page.locator('#name')).toHaveText('Fallback');
    const web = join(root, 'src/themes/a/native.web.json');
    writeFileSync(web, '{"name":"Local"}');
    await expect(page.locator('#name')).toHaveText('Local');
    writeFileSync(web, '{"name":"Changed"}');
    await expect(page.locator('#name')).toHaveText('Changed');
    rmSync(web);
    await expect(page.locator('#name')).toHaveText('Fallback');
    writeFileSync(web, '{bad JSON');
    await expect(page.locator('#diagnostic')).toContainText('native.web.json');
    await expect(page.locator('#name')).toHaveText('Fallback');
    writeFileSync(settingsPath, JSON.stringify({ fallback: { web: { name: 'Configured fallback' } } }));
    await expect(page.locator('#name')).toHaveText('Configured fallback');
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await server.close();
    rmSync(root, { recursive: true, force: true });
  }
});
