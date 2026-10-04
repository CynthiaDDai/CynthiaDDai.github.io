import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Exercises the placeholder content and site.json values (files named placeholder-*).
// When real content replaces them, update or delete this file together with them.

async function command(page: Page, value: string) {
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  await page.keyboard.press(':');
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill(value); await input.press('Enter');
}

test('feed and sitemap follow site.json feed directories, drafts and examples', async ({ request }) => {
  const rss = await (await request.get('/rss.xml')).text();
  expect(rss).toMatch(/\/blog\/placeholder-hello<\/link>/);
  expect(rss).toMatch(/\/research\/placeholder-study<\/link>/);
  expect(rss).not.toMatch(/the-shape-of-attention|placeholder-draft|projects\/|notes\//);
  expect(rss).not.toMatch(/placeholder-hello\/<\/link>/);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toMatch(/\/notes\/placeholder-topic\/placeholder-detail<\/loc>/);
  expect(sitemap).toMatch(/\/blog\/placeholder-hello<\/loc><lastmod>2026-09-28<\/lastmod>/);
  for (const path of ['/blog/placeholder-draft', '/_drafts/placeholder-scratch', '/_drafts', '/blog/_assets']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test('profile values fill the wordmark, footers, contact page and fastfetch', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-wordmark')).toHaveText('cynthia’s space');
  await expect(page.locator('.home-caption')).toHaveText('a personal space');
  await expect(page.locator('.home-footer > span').first()).toHaveText('writing · building · thinking');
  await command(page, 'fastfetch');
  const network = page.locator('.fastfetch-block').nth(3);
  await expect(network.locator('a[href="mailto:hello@placeholder.test"]')).toBeVisible();
  await expect(network.locator('a[href="https://github.com/placeholder-cynthia"]')).toBeVisible();
  await expect(network.locator('a[href="https://social.placeholder.test/@cynthia"]')).toBeVisible();
  await command(page, 'ssh');
  await expect(page.locator('.command-rows dt').filter({ hasText: /^placeholder-friend$/ })).toHaveCount(1);
  await page.goto('/contact');
  await expect(page.locator('.prose a[href="mailto:hello@placeholder.test"]')).toBeVisible();
  await expect(page.locator('.prose')).toContainText('Find me on GitHub');
  await expect(page.locator('.prose')).toContainText('Mastodon');
  await expect(page.locator('.prose')).not.toContainText('haven’t been added yet');
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A path less travelled.');
  await expect(page.locator('.page-footer')).toContainText('Take your time.');
});

test('every document uses the article layout and returns to its parent by title', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('main.article-main')).toBeVisible();
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await page.getByRole('link', { name: '← Back to Home' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/notes/placeholder-topic/placeholder-detail');
  await expect(page.locator('.article-meta time')).toHaveText('September 5, 2026');
  await page.getByRole('link', { name: '← Back to Placeholder topic' }).click();
  await expect(page).toHaveURL('/notes/placeholder-topic');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await page.goto('/projects/placeholder-tool');
  await expect(page.locator('.status')).toHaveText('prototype');
  await expect(page.getByRole('link', { name: 'Source code ↗' })).toHaveAttribute('href', 'https://github.com/placeholder-cynthia/placeholder-tool');
  await expect(page.getByRole('link', { name: 'Visit project ↗' })).toBeVisible();
});

test('a placeholder post renders its asset, math, contents, footnote and absolute links', async ({ page }) => {
  await page.goto('/blog/placeholder-hello');
  const image = page.getByRole('img', { name: 'Placeholder diagram' });
  await expect(image).toBeVisible();
  expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('details.toc')).toContainText('On this page');
  await expect(page.locator('.footnotes')).toContainText('A placeholder footnote.');
  await expect(page.locator('.updated time')).toHaveText('September 28, 2026');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'placeholder topic' }).click();
  await expect(page).toHaveURL('/notes/placeholder-topic');
  await expect(page.locator('.prose')).toContainText('introduced by its own');
  await expect(page.locator('.content-list a[href="/notes/placeholder-topic/placeholder-detail"]')).toBeVisible();
  await page.goto('/notes');
  await command(page, 'ls');
  const row = page.locator('[data-transcript] a[href="/notes/placeholder-topic"]');
  await expect(row).toContainText('placeholder-topic/');
  await expect(row).toContainText('Dummy nested section with its own index.');
});
