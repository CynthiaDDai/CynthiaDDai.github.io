import { parseOhMyPoshTheme } from './omp-parser';
import { adaptOhMyPoshTheme, validateThemeAdapterOptions, type ThemeAdapterOptions } from './omp-adapter';
import type { SiteTheme } from './types';
import { attachMobileTheme, type MobileThemeOptions } from './mobile';

export interface ThemeCatalogSettings {
  default?: string;
  order?: string[];
  fallback?: {
    web?: ThemeAdapterOptions;
    mobile?: 'compact' | 'desktop' | MobileThemeOptions;
    invalidCompanion?: 'fallback' | 'error';
  };
}

// File discovery belongs to Vite; catalog construction is also testable without a browser.
export function createThemeCatalog(sources: Record<string, unknown>, overrides: Record<string, unknown> = {}, settings: ThemeCatalogSettings = {}, mobiles: Record<string, unknown> = {}, warnings: Record<string, string[]> = {}): { themes: SiteTheme[]; defaultTheme: SiteTheme } {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('themes.json must be an object.');
  if (settings.fallback !== undefined && (!settings.fallback || typeof settings.fallback !== 'object' || Array.isArray(settings.fallback))) throw new Error('themes.json fallback must be an object.');
  const fallback = settings.fallback || {};
  for (const key of Object.keys(fallback)) if (!['web', 'mobile', 'invalidCompanion'].includes(key)) throw new Error(`Unknown themes.json fallback field: ${key}`);
  const invalidCompanion = fallback.invalidCompanion === undefined ? 'fallback' : fallback.invalidCompanion;
  if (!['fallback', 'error'].includes(invalidCompanion)) throw new Error('fallback.invalidCompanion must be fallback or error.');
  const webFallback = validateThemeAdapterOptions(fallback.web === undefined ? {} : fallback.web, 'fallback.web');
  const mobileFallback = fallback.mobile === undefined ? 'compact' : fallback.mobile;
  if (typeof mobileFallback === 'string' && !['compact', 'desktop'].includes(mobileFallback)) throw new Error('fallback.mobile must be compact, desktop or a mobile companion object.');
  if (mobileFallback === null || typeof mobileFallback !== 'string' && (typeof mobileFallback !== 'object' || Array.isArray(mobileFallback))) throw new Error('fallback.mobile must be compact, desktop or a mobile companion object.');
  const themes = Object.entries(sources).map(([path, source]) => {
    const id = path.split('/').at(-2)!;
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) throw new Error(`Theme folder must use lowercase letters, numbers, underscores or hyphens: ${path}`);
    try {
      const diagnostics = [...(warnings[path] || [])];
      let options = webFallback;
      if (overrides[path] !== undefined) {
        try { options = validateThemeAdapterOptions(overrides[path], path.replace(/\.omp\.json$/, '.web.json')); }
        catch (error) {
          if (invalidCompanion === 'error') throw error;
          diagnostics.push(`${error instanceof Error ? error.message : error} Using fallback.web.`);
        }
      }
      const parsed = parseOhMyPoshTheme(source);
      const theme = adaptOhMyPoshTheme(parsed, { ...options, id, name: options.name || id.replace(/[_-]+/g, ' ').replace(/\b[a-z]/g, char => char.toUpperCase()) });
      theme.terminal.warnings.push(...diagnostics);
      if (!parsed.background && !parsed.palette.bg && !parsed.palette.background && !options.chrome?.background) {
        theme.terminal.warnings.push('No terminal background in source; using a neutral website background. Set chrome.background in the companion .web.json to match your terminal.');
      }
      let hasMobile = false;
      if (mobiles[path] !== undefined) {
        try { attachMobileTheme(theme, mobiles[path]); hasMobile = true; }
        catch (error) {
          if (invalidCompanion === 'error') throw error;
          theme.terminal.warnings.push(`${error instanceof Error ? error.message : error} Using fallback.mobile.`);
        }
      }
      if (!hasMobile) {
        if (typeof mobileFallback === 'string') theme.mobileFallback = mobileFallback;
        else attachMobileTheme(theme, mobileFallback);
      }
      return theme;
    } catch (error) {
      throw new Error(`Cannot import theme ${path}: ${error instanceof Error ? error.message : error}`);
    }
  });
  if (!themes.length) throw new Error('Add at least one theme folder with an .omp.json file in src/themes.');
  const ids = new Set<string>();
  for (const theme of themes) {
    if (ids.has(theme.id)) throw new Error(`Duplicate theme folder: ${theme.id}`);
    ids.add(theme.id);
  }
  const order = settings.order || [];
  const position = (id: string) => order.includes(id) ? order.indexOf(id) : order.length;
  themes.sort((a, b) => position(a.id) - position(b.id) || a.id.localeCompare(b.id));
  const defaultTheme = themes.find(theme => theme.id === settings.default) || themes[0];
  return { themes, defaultTheme };
}
