import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function command(page: Page, value: string) {
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill(value); await input.press('Enter');
}
async function focusCommand(page: Page) {
  // A URL assertion can finish as navigation commits, before the new page's
  // module scripts attach keyboard handlers.
  await page.waitForLoadState('load');
  await page.keyboard.press(':');
  await expect(page.getByRole('textbox', { name: 'Site command' })).toBeFocused();
}

test('home starts with a centered prompt, exact palette, and no autofocus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/');
  const prompt = page.locator('.command-form'); const rect = await prompt.boundingBox();
  expect(rect!.y).toBeGreaterThan(290); expect(rect!.y).toBeLessThan(450);
  await expect(page.getByRole('textbox')).not.toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(36, 40, 59)');
  await page.waitForTimeout(2400);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
});
test('home stays wide and centered, autoscrolls help output, and keeps all results', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/');
  const terminal = page.locator('.terminal-hero');
  const input = page.getByRole('textbox', { name: 'Site command' });
  const transcript = page.locator('[data-transcript]');
  const initial = await terminal.boundingBox();
  expect(initial!.width).toBeGreaterThan(1440 * .65);
  expect(Math.abs(initial!.x + initial!.width / 2 - 720)).toBeLessThan(2);
  for (let i = 0; i < 6; i++) {
    await command(page, 'help'); await expect(input).toBeInViewport({ ratio: 1 });
    await expect.poll(() => transcript.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
  }
  const rect = await terminal.boundingBox(); const stage = await page.locator('.terminal-stage').boundingBox();
  expect(Math.abs(rect!.y + rect!.height / 2 - (stage!.y + stage!.height / 2))).toBeLessThan(3);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await expect(transcript.locator('.transcript-entry')).toHaveCount(6);
  await transcript.evaluate(element => { element.scrollTop = 0; });
  await expect(transcript.locator('.transcript-entry').first()).toBeInViewport();
  for (let i = 0; i < 28; i++) await command(page, 'pwd');
  await expect(transcript.locator('.transcript-entry')).toHaveCount(34);
  await expect(input).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'test-results/home-history-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.mobile-home-index')).toHaveAttribute('open', '');
  await expect(input).not.toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-history-mobile.png', fullPage: true });
});

test('article commands keep one disposable result without recording or recalling history', async ({ page }) => {
  await page.goto('/'); await command(page, 'ls');
  const saved = await page.evaluate(() => sessionStorage.getItem('command-history'));
  await page.goto('/blog/the-shape-of-attention'); await command(page, 'pwd');
  await command(page, 'help');
  await expect(page.locator('[data-transcript] .transcript-entry')).toHaveCount(1);
  await expect(page.locator('[data-transcript] .transcript-command')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('command-history'))).toBe(saved);
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.press('ArrowUp'); await expect(input).toHaveValue('');
  await input.press('Escape'); await expect(page.locator('[data-transcript]')).toBeEmpty();
});
test('ls produces actual links, and cd navigates the same routes', async ({ page }) => {
  await page.goto('/'); await command(page, 'ls');
  await page.locator('[data-transcript] a[href="/blog"]').click(); await expect(page).toHaveURL('/blog');
  await page.goto('/'); await command(page, 'cd ~/projects'); await expect(page).toHaveURL('/projects');
});
test('inline article commands resolve parents and previous routes', async ({ page }) => {
  await page.goto('/blog/the-shape-of-attention'); await focusCommand(page); await command(page, 'cd ..');
  await expect(page).toHaveURL('/blog'); await focusCommand(page); await command(page, 'cd -');
  await expect(page).toHaveURL('/blog/the-shape-of-attention');
});
test('normal navigation, breadcrumbs, and browser back work', async ({ page }) => {
  await page.goto('/blog'); await page.locator('.content-list a').first().click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL('/projects'); await focusCommand(page); await command(page, 'back');
  await expect(page).toHaveURL('/blog/the-shape-of-attention');
});
test('desktop rail expands with pointer and keyboard focus', async ({ page }) => {
  await page.goto('/'); const rail = page.locator('.edge-menu');
  await rail.locator('.edge-handle').hover(); await expect(rail.getByRole('link', { name: 'blog/' })).toBeVisible();
  await page.mouse.move(100, 100); await rail.locator('.edge-handle').focus();
  await expect(rail.getByRole('link', { name: 'projects/' })).toBeVisible();
  await page.keyboard.press('Tab'); await expect(rail.getByRole('link', { name: 'about' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL('/about');
});
test('mobile navigation needs no hover and never overflows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Notes' }).click();
  await expect(page).toHaveURL('/notes');
  await page.locator('.mobile-nav summary').click(); await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL('/blog');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/'); await page.waitForTimeout(2400); await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
});
test('theme command switches and persists across routes and reloads', async ({ page }) => {
  await page.goto('/'); await command(page, 'theme paper');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await command(page, 'cd ~/blog'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(244, 241, 235)');
});
test('discovered 1_shell theme completes, renders source colors and persists with linked paths', async ({ page }) => {
  await page.goto('/'); await command(page, 'theme');
  await expect(page.locator('[data-transcript]')).toContainText('1_shell');
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill('theme 1'); await input.press('Tab'); await expect(input).toHaveValue('theme 1_shell');
  await input.press('Enter'); await expect(page.locator('html')).toHaveAttribute('data-theme', '1_shell');
  const form = page.locator('.command-form');
  await expect(form).toContainText('cynthia on');
  await expect(form).not.toContainText('<#');
  await expect(form.locator('.prompt-line')).toContainText(/\d+:\d{2} (AM|PM)/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(23, 25, 31)');
  await command(page, 'not-a-command');
  expect(await form.locator('[data-prompt-tail] .prompt-segment').last().evaluate(element => getComputedStyle(element).color)).toBe('rgb(239, 83, 80)');
  await command(page, 'clear'); await page.screenshot({ path: 'test-results/1-shell-home.png', fullPage: true });
  await command(page, 'cd ~/blog/the-shape-of-attention'); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', '1_shell');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(1);
  await expect(form.locator('a[aria-current="page"]')).toHaveAttribute('href', '/blog/the-shape-of-attention');
  await page.screenshot({ path: 'test-results/1-shell-article.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/1-shell-mobile.png', fullPage: true });
});
test('article syntax colors switch with every website theme without reloading', async ({ page }) => {
  await page.goto('/blog/the-shape-of-attention');
  const code = page.locator('pre.astro-code').first();
  const colors: string[] = [];
  for (const id of ['storm', 'paper', '1_shell']) {
    await command(page, `theme ${id}`);
    const background = await code.evaluate(element => getComputedStyle(element).backgroundColor);
    const keyword = code.locator('span[style*="--shiki-token-keyword"]').first();
    await expect(keyword).toBeVisible();
    colors.push(await keyword.evaluate(element => getComputedStyle(element).color));
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
  }
  expect(new Set(colors).size).toBe(3);
});
test('recent commands, persistent Tab completion, clear, and escape work', async ({ page }) => {
  await page.goto('/'); await command(page, 'pwd');
  const input = page.getByRole('textbox'); await input.press('ArrowUp'); await expect(input).toHaveValue('pwd');
  await input.press('ArrowDown'); await expect(input).toHaveValue('');
  await input.fill('fastf'); await input.press('Tab'); await expect(input).toHaveValue('fastfetch');
  await input.press('Tab'); await expect(input).toBeFocused();
  await input.press('Shift+Tab'); await expect(input).not.toBeFocused();
  await command(page, 'clear'); await expect(page.locator('[data-transcript]')).toBeEmpty();
  await page.goto('/about'); await focusCommand(page); await input.press('Escape');
  await expect(input).not.toBeFocused(); await expect(page.locator('.command-bar')).toBeVisible();
});
test('unfocused printable keys stay available to the browser and extensions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { cancelledKeys: string[] }).cancelledKeys = [];
    window.addEventListener('keydown', event => {
      if (event.defaultPrevented) (window as unknown as { cancelledKeys: string[] }).cancelledKeys.push(event.key);
    });
  });
  for (const key of ['j', 'k', 'f', 'g', 'o', 't', '/']) await page.keyboard.press(key);
  expect(await page.evaluate(() => (window as unknown as { cancelledKeys: string[] }).cancelledKeys)).toEqual([]);
  await expect(page.getByRole('textbox')).toHaveValue('');
});
test('math, highlighted code, footnotes, and headings arrive as static HTML', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL }); const page = await context.newPage();
  await page.goto('/blog/the-shape-of-attention');
  await expect(page.locator('.katex').first()).toBeVisible(); await expect(page.locator('pre.astro-code')).toBeVisible();
  await expect(page.locator('.footnotes')).toBeVisible(); await expect(page.locator('#queries-keys-and-values')).toBeVisible();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL('/projects');
  await page.goto('/notes/paths-have-parents');
  await expect(page.locator('.katex').first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL('/projects');
  await page.locator('.mobile-nav summary').click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL('/blog'); await context.close();
});
test('command output escapes hostile input and stays out of article prose', async ({ page }) => {
  await page.goto('/blog/the-shape-of-attention'); const before = await page.locator('.prose').textContent();
  await focusCommand(page); await command(page, '<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-transcript] img')).toHaveCount(0);
  expect(await page.locator('.prose').textContent()).toBe(before);
});

test('Tab recomputes suggestions after editing cd, and completes into articles', async ({ page }) => {
  await page.goto('/'); await focusCommand(page);
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill('cd'); await input.press('Tab');
  await expect(input).toHaveValue('cd '); await expect(input).toBeFocused();
  await expect(page.getByRole('button', { name: 'Complete cd blog/', exact: true })).toBeVisible();
  await input.pressSequentially('blog'); await input.press('Tab');
  await expect(input).toHaveValue('cd blog/'); await expect(input).toBeFocused();
  await expect(page.getByRole('button', { name: 'Complete cd blog/the-shape-of-attention', exact: true })).toBeVisible();
  await input.pressSequentially('the'); await input.press('Tab'); await expect(input).toHaveValue('cd blog/the-shape-of-attention'); await expect(input).toBeFocused();
  await input.press('Enter'); await expect(page).toHaveURL('/blog/the-shape-of-attention');
  await focusCommand(page); await input.fill('cd ~/'); await input.press('Tab');
  await input.press('ArrowDown');
  await expect(page.locator('[data-completions] button').first()).toBeFocused();
  await page.keyboard.press('Enter'); await expect(input).toBeFocused();
});

test('article has one linked path in a visible command bar above its heading', async ({ page }) => {
  await page.goto('/blog/the-shape-of-attention');
  const bar = page.locator('.command-bar');
  await expect(bar).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(1);
  await expect(page.locator('.top-nav [aria-label="Breadcrumb"]')).toHaveCount(0);
  await expect(page.locator('#command-drawer')).toHaveCount(0);
  const barRect = await bar.boundingBox(); const headingRect = await page.locator('.article-heading').boundingBox();
  expect(barRect!.y + barRect!.height).toBeLessThan(headingRect!.y);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await focusCommand(page); await expect(page.getByRole('textbox', { name: 'Site command' })).toBeInViewport();
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'blog', exact: true }).click();
  await expect(page).toHaveURL('/blog');
});

test('s searches body text and static pages, with keyboard navigation', async ({ page }) => {
  await page.goto('/about'); await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true'); await page.keyboard.press('s');
  const dialog = page.getByRole('dialog', { name: 'Search this space' });
  const search = page.getByRole('searchbox', { name: 'Search the website' });
  await expect(dialog).toBeVisible(); await expect(search).toBeFocused();
  await search.fill('softmax');
  await expect(dialog.locator('a[href="/blog/the-shape-of-attention"]')).toBeVisible();
  await search.press('ArrowDown'); await expect(dialog.locator('a').first()).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(search).toBeFocused();
  await search.press('Enter'); await expect(page).toHaveURL('/blog/the-shape-of-attention');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true'); await page.keyboard.press('s'); await search.fill('KaTeX Shiki');
  await expect(dialog.locator('a[href="/uses"]')).toBeVisible();
  await search.fill('no-such-search-result'); await expect(dialog.getByRole('status')).toContainText('No matching');
  await search.press('Escape'); await expect(dialog).not.toBeVisible();
});

test('one Escape closes search for empty or filled queries and focused results, restoring focus', async ({ page }) => {
  await page.goto('/about');
  const trigger = page.locator('.shell-hint [data-open-search]');
  const dialog = page.getByRole('dialog', { name: 'Search this space' });
  const search = page.getByRole('searchbox', { name: 'Search the website' });
  for (const query of ['', 'attention', 'no-matching-page']) {
    await trigger.click(); await expect(search).toBeFocused();
    await search.fill(query); await search.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.locator('#site-search-input').inputValue()).toBe(query);
  }
  await trigger.click(); await search.fill('attention'); await search.press('ArrowDown');
  await expect(dialog.locator('a').first()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('s'); await expect(search).toBeFocused();
  await search.press('Escape'); await expect(dialog).not.toBeVisible();
});

test('if_tea preserves its icons and caps and renders them with the bundled webfont', async ({ page }) => {
  await page.goto('/about'); await command(page, 'theme if_tea');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'if_tea');
  const form = page.locator('.command-form');
  await expect(form).toContainText('╭─');
  await expect(form).toContainText('╰─');
  const glyphs = ['\ue641', '\uf073', '\ue5ff', '\ue0b0', '\ue0b2', '\ue0c0', '\ue285', '\uf105', '\uf197'];
  for (const glyph of glyphs) await expect(form.locator('.prompt-glyph').filter({ hasText: glyph }).first()).toBeVisible();
  expect(await form.textContent()).not.toMatch(/•|<transparent|<#|{{/);
  await expect(form.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable'); await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-command-form] .prompt-glyph' });
  for (const nodeId of nodeIds) {
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    expect(fonts.some(font => font.isCustomFont && font.familyName === 'Symbols Nerd Font Mono' && font.glyphCount > 0)).toBe(true);
  }
  await session.detach();
  const path = form.locator('.prompt-segment').filter({ has: page.getByRole('navigation', { name: 'Breadcrumb' }) });
  expect(await path.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(248, 103, 123)');
  await command(page, 'not-a-command');
  expect(await form.locator('[data-prompt-tail] .prompt-segment').last().evaluate(element => getComputedStyle(element).color)).toBe('rgb(239, 83, 80)');
  await command(page, 'clear');
  await page.screenshot({ path: 'test-results/if-tea-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/if-tea-mobile.png', fullPage: true });
});

test('shortcuts preserve punctuation in text fields, modifiers, and editable content', async ({ page }) => {
  await page.goto('/'); await focusCommand(page);
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.pressSequentially('cd ~/blog:');
  await expect(input).toHaveValue('cd ~/blog:'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await input.press('Escape'); await page.keyboard.press('Control+s');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.evaluate(() => {
    const editor = document.createElement('div'); editor.contentEditable = 'true'; editor.id = 'test-editor'; document.body.append(editor); editor.focus();
  });
  await page.keyboard.type('/:s'); await expect(page.locator('#test-editor')).toHaveText('/:s');
  await expect(input).not.toBeFocused(); await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('#test-editor').evaluate(element => element.remove());
  await page.keyboard.press('s');
  const search = page.getByRole('searchbox'); await search.fill('path: /notes');
  await expect(search).toHaveValue('path: /notes');
});

test('long paths, commands, and suggestions wrap fully on narrow screens', async ({ page }) => {
  const slug = 'a-very-long-article-title-about-navigation-and-terminal-completion-'.repeat(5) + 'end';
  await page.route('**/blog/the-shape-of-attention', async route => {
    const response = await route.fetch();
    let body = (await response.text()).replaceAll('the-shape-of-attention', slug);
    body = body.replace(/(<script id="site-data"[^>]*>)([\s\S]*?)(<\/script>)/, (_, opening, json, closing) => {
      const data = JSON.parse(json);
      data.entries.push({ path: `/blog/b-${slug}`, title: 'Another long article', description: 'Long completion fixture', kind: 'blog', tags: [] });
      return opening + JSON.stringify(data).replaceAll('<', '\\u003c') + closing;
    });
    await route.fulfill({ response, body });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/the-shape-of-attention');
  await expect(page.locator('.mobile-page-tools .mobile-location')).toContainText(slug);
  await page.getByRole('button', { name: 'Open commands', exact: true }).click();
  await page.locator('[data-manual-command] summary').click();
  const input = page.getByRole('textbox', { name: 'Custom command' });
  await input.fill(`cd ~/blog/${slug}`);
  expect(await input.evaluate(element => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await input.fill('cd ~/blog/a'); await input.press('Tab');
  await expect(input).toHaveValue(`cd ~/blog/${slug}`);
  expect(await input.evaluate(element => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await input.fill('cd ~/blog/'); await input.press('Tab');
  expect(await page.locator('[data-mobile-completions] button').count()).toBeGreaterThan(1);
  await expect(page.locator('[data-mobile-completions] button').first()).toContainText(slug);
  expect(await page.locator('[data-mobile-completions] button').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth + 1))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/long-command-mobile.png', fullPage: true });
});

test('fastfetch shows four website blocks, ssh opens a new tab and preserves the site', async ({ page, context }) => {
  await page.goto('/'); await command(page, 'fastfetch');
  await expect(page.locator('.fastfetch-heading')).toContainText(['USER', 'SYSTEM', 'ACTIVITY', 'NETWORK']);
  await expect(page.locator('.fastfetch-block').first()).toContainText('Cynthia');
  const { site: profile } = JSON.parse(await page.locator('#site-data').textContent() ?? '{}') as { site: { activityLimit: number } };
  await expect(page.locator('.fastfetch-block').nth(2).locator('a')).toHaveCount(profile.activityLimit);
  await expect(page.locator('.fastfetch-block').nth(3).locator('a[href="/contact"]')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/fastfetch-desktop.png', fullPage: true });
  await command(page, 'help'); await expect(page.locator('.command-rows').last().locator('dt').filter({ hasText: /^history$/ })).toHaveCount(0);
  await command(page, 'ssh'); await expect(page.locator('[data-transcript] a[href="https://www.google.com/"]')).toBeVisible();
  await expect(page.locator('[data-transcript] a[href="https://www.google.com/"]')).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-transcript] a[href="https://www.google.com/"]')).toHaveAttribute('rel', 'noopener noreferrer');
  const input = page.getByRole('textbox', { name: 'Site command' });
  await input.fill('ssh goo'); await input.press('Tab'); await expect(input).toHaveValue('ssh google');
  await context.route('https://www.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Demo friend</title><p>Connected</p>' }));
  const connection = context.waitForEvent('page');
  await input.press('Enter'); const friend = await connection;
  await expect(friend).toHaveURL('https://www.google.com/'); await expect(page).toHaveURL('/');
  await friend.close();
});
test('search, unknown commands, and fastfetch produce usable output', async ({ page }) => {
  await page.goto('/'); await command(page, 'search attention');
  await expect(page.locator('[data-transcript] a[href="/blog/the-shape-of-attention"]')).toBeVisible();
  await command(page, 'not-a-command'); await expect(page.locator('.command-error')).toContainText('Unknown command');
  await command(page, 'fastfetch'); await expect(page.locator('.fastfetch')).toContainText('2026-10-03');
});
test('home and article pass automated accessibility checks in all themes', async ({ page }) => {
  for (const path of ['/', '/blog/the-shape-of-attention']) {
    await page.goto(path);
    for (const id of ['storm', 'storm_day', 'paper', '1_shell', 'if_tea']) {
      await command(page, `theme ${id}`); await command(page, 'clear');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (path.startsWith('/blog/')) await page.screenshot({ path: `test-results/article-${id}.png`, fullPage: true });
      await page.getByRole('textbox', { name: 'Site command' }).press('Escape');
      await page.keyboard.press('s'); await page.getByRole('searchbox').fill('attention');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole('searchbox').press('Escape');
    }
  }
});
