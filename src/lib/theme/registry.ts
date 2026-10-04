import { createThemeCatalog } from './catalog';
import { themeTokens } from './omp-adapter';
import type { SiteTheme } from './types';
import catalog from 'virtual:site-themes';

export const { themes, defaultTheme } = createThemeCatalog(catalog.sources, catalog.overrides, catalog.settings, catalog.mobiles, catalog.warnings);
if (import.meta.env.DEV && import.meta.env.SSR) {
  for (const theme of themes) {
    if (theme.terminal.warnings.length) console.warn(`[Oh My Posh: ${theme.id}]\n` + theme.terminal.warnings.join('\n'));
  }
}
export { themeTokens };

export class ThemeController {
  current: SiteTheme;
  constructor() {
    this.current = themes.find(theme => theme.id === document.documentElement.dataset.theme) || defaultTheme;
  }
  set(id: string): boolean {
    const theme = themes.find(theme => theme.id === id);
    if (!theme) return false;
    this.current = theme;
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.mode = theme.mode;
    try { localStorage.setItem('site-theme', theme.id); } catch { /* Storage is optional. */ }
    document.dispatchEvent(new CustomEvent('site:theme', { detail: theme }));
    return true;
  }
}
