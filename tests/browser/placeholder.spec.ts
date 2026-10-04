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

test('a grouped directory lists works under status headings with their own links', async ({ page }) => {
  await page.goto('/papers');
  await expect(page.locator('.content-group')).toHaveText(['Publications· 1', 'Preprints· 1']);
  const work = page.locator('.prompt-card').filter({ hasText: 'Placeholder: a published work' });
  // Each work is the theme's transient prompt for …/name, with its group's git state (storm: ✓ clean, ~ working changes).
  await expect(work.locator('.card-prompt')).toContainText('…/placeholder-published');
  await expect(work.locator('.card-title-text')).toHaveText('placeholder-published');
  await expect(work.locator('.card-prompt')).toContainText('✓');
  await expect(page.locator('.prompt-card').filter({ hasText: 'Placeholder: a preprint' }).locator('.card-prompt')).toContainText('~');
  await expect(work.locator('.card-name')).toHaveText('Placeholder: a published work');
  await expect(work.locator('.card-output')).toContainText('2025-06-01 · Cynthia Placeholder, A. Coauthor · Journal of Placeholders');
  await expect(work.getByRole('link', { name: 'arXiv ↗' })).toHaveAttribute('href', 'https://arxiv.org/abs/0000.00000');
  await expect(work.getByRole('link', { name: 'Placeholder: a published work' })).toHaveAttribute('href', '/papers/placeholder-published');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  // The extra link stays clickable above the stretched title link; the rest of the row opens the work.
  await work.getByRole('link', { name: 'Notes' }).click();
  await expect(page).toHaveURL('/notes/placeholder-topic');
  await page.goBack();
  await work.click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL('/papers/placeholder-published');
  await expect(page.locator('.article-byline')).toHaveText('Cynthia Placeholder, A. Coauthor');
  await expect(page.locator('.article-meta')).toContainText('Journal of Placeholders');
  await expect(page.locator('.project-links').getByRole('link', { name: 'arXiv ↗' })).toBeVisible();
  // An ordinary listing uses the same prompts; a directory's path ends in /, and a title its path already says is not repeated.
  await page.goto('/notes');
  const topic = page.locator('.prompt-card').filter({ has: page.locator('a[href="/notes/placeholder-topic"]') });
  await expect(topic.locator('.card-prompt')).toContainText('…/placeholder-topic/');
  await expect(topic.locator('.card-prompt')).not.toContainText('✓');
  await expect(topic.locator('.card-name')).toHaveCount(0);
});

test('a standalone link to a public file becomes a card, with the following lines as its description', async ({ page }) => {
  await page.goto('/notes/placeholder-files');
  const cards = page.locator('.file-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first().getByRole('link', { name: 'Placeholder diagram' })).toHaveAttribute('href', '/navigation-model.svg');
  await expect(cards.first().locator('.card-description')).toContainText('standing in for one sentence');
  await expect(cards.first().locator('.card-description .katex')).toBeVisible();
  // The card is named after its title; ⇣ marks something to pull, and a "wip" title working changes.
  await expect(cards.first().locator('.card-prompt')).toContainText('…/placeholder-diagram');
  await expect(cards.first().locator('.card-prompt')).toContainText('✓ ⇣');
  await expect(cards.nth(1).locator('.card-prompt')).toContainText('~ ⇣');
  await expect(cards.first().locator('.card-output')).toContainText('SVG · 1 KB');
  await expect(cards.nth(1).locator('.card-description')).toHaveCount(0);
  await expect(cards.nth(1).getByRole('link', { name: 'Download favicon.svg' })).toHaveAttribute('download', '');
  await expect(cards.nth(1).getByRole('link', { name: 'Download favicon.svg' })).toHaveText('pull');
  await expect(page.locator('.prose > p > a[href="/favicon.svg"]')).toHaveText('this icon');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
