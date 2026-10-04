import { parseOhMyPoshTheme } from './omp-parser';
import { adaptOhMyPoshTheme, themeTokens, type ThemeAdapterOptions } from './omp-adapter';
import type { PromptTheme, SiteTheme } from './types';

export interface MobileThemeOptions extends ThemeAdapterOptions { prompt?: unknown; }

export function mobilePrompt(theme: SiteTheme): PromptTheme {
  if (!theme.mobile && theme.mobileFallback === 'desktop') return theme.terminal;
  return theme.mobile?.terminal || parseOhMyPoshTheme({ palette: theme.palette, blocks: [{ segments: [
    { type: 'path', style: 'plain', foreground: 'p:blue', template: '{{ .Path }}' },
    { type: 'text', style: 'plain', foreground: 'p:green', template: ' ❯ ' },
  ] }] });
}

export function attachMobileTheme(theme: SiteTheme, source: unknown): void {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('theme_mobile.json must be an object.');
  const options = source as MobileThemeOptions;
  const allowed = ['prompt', 'mode', 'chrome', 'prose', 'syntax', 'segmentOverrides'];
  for (const key of Object.keys(options)) if (!allowed.includes(key)) throw new Error(`Unknown theme_mobile.json field: ${key}`);
  if (options.mode !== undefined && !['light', 'dark'].includes(options.mode)) throw new Error('Invalid mode in theme_mobile.json.');
  for (const key of ['chrome', 'prose', 'syntax', 'segmentOverrides'] as const) {
    if (options[key] !== undefined && (!options[key] || typeof options[key] !== 'object' || Array.isArray(options[key]))) throw new Error(`Mobile ${key} must be an object.`);
  }
  const parsed = options.prompt === undefined ? mobilePrompt(theme) : parseOhMyPoshTheme(options.prompt);
  parsed.palette = { ...theme.terminal.palette, ...parsed.palette };
  const mobile = adaptOhMyPoshTheme(parsed, {
    ...options, id: theme.id, mode: options.mode || theme.mode,
    chrome: { ...theme.chrome, ...options.chrome }, prose: { ...theme.prose, ...options.prose }, syntax: { ...theme.syntax, ...options.syntax },
  });
  theme.mobile = { terminal: mobile.terminal, tokens: themeTokens(mobile), mode: mobile.mode };
}
