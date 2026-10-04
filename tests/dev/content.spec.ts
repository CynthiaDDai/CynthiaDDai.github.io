import { test, expect } from '@playwright/test';
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, symlinkSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

test('dev discovers added, edited and removed content without restarting the server', async ({ page, request }) => {
  test.setTimeout(60000);
  const root = mkdtempSync(join(tmpdir(), 'terminal-content-dev-'));
  for (const name of ['src', 'scripts', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'config.jsonc']) cpSync(name, join(root, name), { recursive: true });
  // Build the fixture site, not the real content.
  rmSync(join(root, 'src/content'), { recursive: true, force: true });
  cpSync('tests/fixtures/site/content', join(root, 'src/content'), { recursive: true });
  cpSync('tests/fixtures/site/site.json', join(root, 'src/config/site.json'));
  symlinkSync(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir');
  const server = spawn(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', '4336', '--ignore-lock'], { cwd: root, stdio: 'pipe', env: Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('SITE_'))) });
  let output = '';
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  const origin = 'http://127.0.0.1:4336';
  const html = async (path: string) => {
    try { return await (await request.get(`${origin}${path}`)).text(); } catch { return ''; }
  };
  try {
    await expect.poll(() => html('/'), { timeout: 20000, message: 'Astro fixture must start' }).toContain('site-data');
    const content = join(root, 'src/content');
    mkdirSync(join(content, 'research/deep'), { recursive: true });
    writeFileSync(join(content, 'foo.md'), 'Developmentroottoken.\n');
    writeFileSync(join(content, 'research/deep/post.md'), 'Developmentsearchtoken.\n');
    await expect.poll(() => html('/research/deep/post'), { timeout: 10000 }).toContain('Developmentsearchtoken');
    await expect.poll(() => html('/foo')).toContain('Developmentroottoken');
    await page.goto(`${origin}/`);
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    const input = page.getByRole('textbox', { name: 'Site command', exact: true });
    await input.fill('ls'); await input.press('Enter');
    await expect(page.locator('[data-transcript] a[href="/foo"]')).toBeVisible();
    await expect(page.locator('[data-transcript] a[href="/research"]')).toHaveText(/research\//);
    await input.fill('cd re'); await input.press('Tab');
    await expect(input).toHaveValue('cd research/');
    await input.fill('cd foo'); await input.press('Enter');
    await expect(page).toHaveURL(`${origin}/foo`);
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    await page.keyboard.press('s');
    const dialog = page.getByRole('dialog', { name: 'Search this space' });
    await page.getByRole('searchbox').fill('Developmentsearchtoken');
    await expect(dialog.locator('a[href="/research/deep/post"]')).toBeVisible();
    await expect(dialog.locator('a[href="/research"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.goto(`${origin}/research/deep/post`);
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    const articleInput = page.getByRole('textbox', { name: 'Site command', exact: true });
    await articleInput.fill('pwd'); await articleInput.press('Enter');
    await expect(page.locator('.command-bar [data-transcript]')).toContainText('~/research/deep/post');
    await articleInput.fill('cd ..'); await articleInput.press('Enter');
    await expect(page).toHaveURL(`${origin}/research/deep`);
    writeFileSync(join(content, 'Bad Name.md'), 'Rejected.\n');
    await expect.poll(async () => (await request.get(`${origin}/`)).status()).toBe(500);
    expect(output).toContain('src/content/Bad Name.md');
    unlinkSync(join(content, 'Bad Name.md'));
    await expect.poll(() => html('/')).toContain('site-data');
    writeFileSync(join(content, 'research/index.md'), '---\ntitle: Research lab\n---\nUpdatedlandingtoken.\n');
    await expect.poll(() => html('/research')).toContain('Updatedlandingtoken');
    await page.goto(`${origin}/research`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Research lab');
    await expect(page.locator('.content-list a[href="/research/deep"]')).toBeVisible();
    writeFileSync(join(content, 'research/deep/sibling.md'), 'Keeps the directory published.\n');
    writeFileSync(join(content, 'research/deep/post.md'), '---\ndraft: true\n---\nDevelopmentsearchtoken.\n');
    await expect.poll(async () => (await html('/research/deep')).includes('class="content-link" href="/research/deep/post"')).toBe(false);
    expect((await request.get(`${origin}/research/deep/post`)).status()).toBe(404);
    await page.goto(`${origin}/research/deep`);
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    await page.keyboard.press('s');
    await page.getByRole('searchbox').fill('Developmentsearchtoken');
    await expect(dialog.getByRole('status')).toContainText('No matching');
    unlinkSync(join(content, 'foo.md'));
    await expect.poll(async () => (await html('/')).includes('href="/foo"')).toBe(false);
    expect((await request.get(`${origin}/foo`)).status()).toBe(404);
    expect(output).not.toContain('Failed to resolve import');
  } finally {
    const stopped = new Promise<void>(resolve => server.once('close', () => resolve()));
    server.kill('SIGTERM');
    await stopped;
    rmSync(root, { recursive: true, force: true });
  }
});
