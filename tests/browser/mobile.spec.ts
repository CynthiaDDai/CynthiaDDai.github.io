import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('index takes over home, exposes all navigation and keeps the keyboard closed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mobile-home-index')).toHaveAttribute('open', '');
  // Navigation follows src/content, so the expectation comes from the shipped content tree.
  const { entries } = JSON.parse(await page.locator('#site-data').textContent() ?? '{}') as { entries: { path: string; title: string }[] };
  const roots = entries.filter(entry => /^\/[^/]+$/.test(entry.path)).map(entry => entry.title);
  expect(roots).toEqual(expect.arrayContaining(['About', 'Blog']));
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).locator('a > span:first-child')).toHaveText(roots);
  await expect(page.getByRole('button', { name: 'Command', exact: true })).toBeVisible();
  await expect(page.locator('.terminal-hero')).not.toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/mobile-index-storm.png', fullPage: true });
  await page.locator('.mobile-home-index > summary').tap();
  await expect(page.locator('.mobile-home-index')).not.toHaveAttribute('open');
  await expect(page.locator('.mobile-home-rest [data-open-command]')).toBeVisible();
  await page.locator('.mobile-home-index > summary').tap();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Blog' }).tap();
  await page.locator('.card-link').first().tap();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The shape of attention');
  await expect(page.locator('.command-form')).not.toBeVisible();
  await page.getByRole('navigation', { name: 'Current location' }).getByRole('link', { name: 'blog', exact: true }).tap();
  await expect(page).toHaveURL('/blog');
});

test('command shortcuts execute without input focus, replace results and restore the opener', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Command', exact: true });
  await opener.tap();
  const panel = page.getByRole('dialog', { name: 'Command', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.locator('.mobile-command-options [data-command]')).toHaveText(['helpShow the way around.↵', 'fastfetchUSER · SYSTEM · ACTIVITY · NETWORK.↵']);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await panel.locator('[data-command="fastfetch"]').tap();
  await expect(panel.locator('.fastfetch-heading')).toContainText(['USER', 'SYSTEM', 'ACTIVITY', 'NETWORK']);
  expect(await page.evaluate(() => document.activeElement?.matches('input, textarea'))).toBe(false);
  await page.screenshot({ path: 'test-results/mobile-fastfetch-storm.png', fullPage: true });
  await panel.locator('[data-command="help"]').tap();
  await expect(panel.locator('.transcript-entry')).toHaveCount(1);
  await expect(panel.locator('[data-mobile-output-title]')).toHaveText('help');
  expect(await page.evaluate(() => document.activeElement?.matches('input, textarea'))).toBe(false);
  await panel.getByRole('button', { name: 'Clear command result' }).tap();
  await expect(panel.locator('[data-mobile-output]')).not.toBeVisible();
  await panel.getByRole('button', { name: 'Close commands' }).tap();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => sessionStorage.getItem('command-history'))).toBeNull();
});

test('typing is opt-in with touch completion and one-Escape dismissal', async ({ page }) => {
  await page.goto('/about');
  await page.getByRole('button', { name: 'Open commands', exact: true }).tap();
  const panel = page.getByRole('dialog', { name: 'Command', exact: true });
  await panel.locator('[data-manual-command] summary').tap();
  const input = panel.getByRole('textbox', { name: 'Custom command' });
  await expect(input).toBeVisible();
  // Expanding the form alone leaves focus on the disclosure, avoiding an unsolicited keyboard.
  await expect(input).not.toBeFocused();
  await input.fill('fastf');
  await panel.getByRole('button', { name: 'Complete command or path' }).tap();
  await expect(input).toHaveValue('fastfetch');
  await panel.getByRole('button', { name: 'Run command' }).tap();
  await expect(panel.locator('.fastfetch')).toBeVisible();
  await expect(input).not.toBeFocused();
  await input.fill('not-a-command'); await input.press('Enter');
  await expect(panel.locator('.command-error')).toContainText('Unknown command');
  await input.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open commands', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open commands', exact: true }).tap();
  await expect(panel.getByRole('textbox')).toHaveCount(0);
});

test('theme picker selects Storm Day without typing and persists on articles', async ({ page }) => {
  await page.goto('/'); await page.locator('.mobile-home-index [data-open-themes]').tap();
  const panel = page.getByRole('dialog', { name: 'Theme', exact: true });
  await panel.getByRole('button', { name: 'Storm Day', exact: true }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'storm_day');
  await expect(panel.getByRole('button', { name: 'Storm Day', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(243, 244, 249)');
  await panel.getByRole('button', { name: 'Close themes' }).tap();
  await page.screenshot({ path: 'test-results/mobile-index-storm-day.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'About' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'storm_day');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'storm_day');
  await page.locator('.mobile-nav > summary').tap();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Contact' }).tap();
  await expect(page).toHaveURL('/contact');
});

test('mobile search is the only tool that immediately requests text and returns focus', async ({ page }) => {
  await page.goto('/blog/the-shape-of-attention');
  const opener = page.getByRole('button', { name: 'Search this space', exact: true });
  await opener.tap();
  const search = page.getByRole('searchbox', { name: 'Search the website' });
  await expect(search).toBeFocused(); await search.fill('softmax');
  await page.getByRole('dialog', { name: 'Search this space' }).getByRole('link', { name: /The shape of attention/ }).tap();
  await expect(page).toHaveURL('/blog/the-shape-of-attention');
  await opener.tap(); await search.fill('KaTeX Shiki');
  await expect(page.locator('#site-search a[href="/uses"]')).toBeVisible();
  await page.getByRole('button', { name: 'Close site search' }).tap();
  await expect(opener).toBeFocused();
});

test('Storm mobile home, article and panels are accessible at narrow, landscape and tablet sizes', async ({ page }) => {
  test.setTimeout(90000);
  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 820, height: 1180 }]) {
    await page.setViewportSize(size);
    for (const path of ['/', '/blog/the-shape-of-attention', '/notes/paths-have-parents', '/uses']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('[data-open-themes]:visible').first().tap();
      for (const id of ['storm', 'storm_day']) {
        await page.locator(`[data-select-theme="${id}"]`).tap();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
      await page.getByRole('button', { name: 'Close themes' }).tap();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.locator('[data-open-command]:visible').first().tap();
      await page.locator('#mobile-command-panel [data-command="fastfetch"]').tap();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: 'Close commands' }).tap();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/blog/the-shape-of-attention');
  await page.screenshot({ path: 'test-results/mobile-article-storm-day.png', fullPage: true });
});
