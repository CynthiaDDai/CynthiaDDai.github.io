import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the timer command opens /timer, which is accessible and kept out of search engines', async ({ page }) => {
  await page.goto('/'); await page.waitForLoadState('load');
  await page.keyboard.press(':');
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill('timer'); await input.press('Enter');
  await expect(page).toHaveURL(/\/timer$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('timer')).toHaveText('1:20:00');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('counts by minutes, then half minutes, then seconds in red, and survives a reload', async ({ page }) => {
  await page.clock.install();
  await page.goto('/timer');
  const clock = page.getByRole('timer'), root = page.locator('[data-timer]');
  await page.locator('[data-duration]').fill('20');
  await expect(clock).toHaveText('20:00');
  await page.getByRole('button', { name: 'start' }).click();
  await page.clock.runFor(1000);
  await expect(clock).toHaveText('20:00');
  await page.clock.runFor(60_000);
  await expect(clock).toHaveText('19:00');
  await page.clock.runFor(17 * 60_000 + 30_000); // 1:29 left: half steps below 2:00
  await expect(clock).toHaveText('1:30');
  await expect(root).toHaveAttribute('data-phase', 'half');
  await page.clock.runFor(30_000); // 0:59 left
  await expect(clock).toHaveText('0:59');
  await expect(root).toHaveAttribute('data-phase', 'final');
  await page.reload();
  await expect(clock).toHaveText(/^0:[0-5]\d$/);
  await expect(root).toHaveAttribute('data-phase', 'final');
  await page.clock.runFor(60_000);
  await expect(clock).toHaveText('0:00');
  await expect(root).toHaveAttribute('data-status', 'done');
});

test('announcements are edited in place as Markdown and LaTeX, block by block', async ({ page }) => {
  await page.goto('/timer');
  const board = page.getByRole('region', { name: 'Announcements' });
  await board.click();
  await page.keyboard.insertText('**Problem 3**: read $x^3$\n\n- No calculators');
  await page.getByRole('timer').click();
  await expect(board.locator('strong')).toHaveText('Problem 3');
  await expect(board.locator('.katex')).toHaveCount(1);
  await expect(board.locator('li')).toHaveText('No calculators');
  await board.locator('li').click();
  await expect(page.getByRole('textbox', { name: 'Edit announcement' })).toHaveValue('- No calculators');
  await expect(board.locator('strong')).toHaveText('Problem 3'); // the other block stays rendered
  await page.keyboard.insertText('\n- Name on every page');
  await page.keyboard.press('Escape');
  await expect(board.locator('li')).toHaveText(['No calculators', 'Name on every page']);
  await page.reload();
  await expect(board.locator('li')).toHaveCount(2);
});

test('time is adjusted from the settings menu, and reset during an exam takes two clicks', async ({ page }) => {
  await page.clock.install();
  await page.goto('/timer');
  await page.locator('[data-duration]').fill('30');
  await page.getByRole('button', { name: 'start' }).click();
  await page.getByText('settings').click();
  await page.getByLabel('adjust time').fill('+5');
  await page.getByRole('button', { name: 'apply' }).click();
  await expect(page.getByRole('timer')).toHaveText('35:00');
  await page.locator('[data-reset]').click();
  await expect(page.locator('[data-timer]')).toHaveAttribute('data-status', 'running');
  await page.locator('[data-reset]').click();
  await expect(page.locator('[data-timer]')).toHaveAttribute('data-status', 'idle');
  await expect(page.getByRole('timer')).toHaveText('30:00');
});

test('a step of 0 is refused and the clock keeps its step; a step of 1 counts every second', async ({ page }) => {
  await page.clock.install();
  await page.goto('/timer');
  await page.locator('[data-duration]').fill('20');
  await page.getByRole('button', { name: 'start' }).click();
  await page.getByText('settings').click();
  const step = page.getByLabel('count down every');
  await step.fill('0');
  await expect(step).toHaveAttribute('aria-invalid', 'true');
  await page.clock.runFor(1500);
  await expect(page.getByRole('timer')).toHaveText('20:00');
  await step.fill('1');
  await expect(step).not.toHaveAttribute('aria-invalid');
  await expect(page.getByRole('timer')).toHaveText('19:59');
  await page.clock.runFor(1000);
  await expect(page.getByRole('timer')).toHaveText('19:58');
});
