import { test, expect } from '@playwright/test';

for (const selected of ['storm', '1_shell', 'if_tea']) {
  test(`dev boots with saved ${selected} despite absent optional companion files`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(id => localStorage.setItem('site-theme', id), selected);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', selected);
    const input = page.getByRole('textbox', { name: 'Site command' });
    await input.fill('help'); await input.press('Enter');
    await expect(page.locator('[data-transcript]')).toContainText('fastfetch');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', selected);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('dev mobile uses the compact fallback with a saved theme that has no mobile companion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('site-theme', '1_shell'));
  await page.goto('/');
  await page.locator('.mobile-home-index [data-open-command]').click();
  const panel = page.getByRole('dialog', { name: 'Command', exact: true });
  await panel.locator('[data-command="fastfetch"]').click();
  await expect(panel.locator('.fastfetch')).toContainText('Cynthia');
  await panel.locator('[data-manual-command] summary').click();
  await expect(panel.locator('.mobile-command-form')).not.toContainText('cynthia on');
  await expect(panel.locator('.mobile-command-form')).toContainText('❯');
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
});
