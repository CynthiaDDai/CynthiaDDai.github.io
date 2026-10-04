import { resolveColor } from './omp-parser';
import type { PromptTheme, SiteTheme } from './types';

export interface ThemeAdapterOptions {
  id?: string;
  name?: string;
  mode?: 'dark' | 'light';
  chrome?: Partial<SiteTheme['chrome']>;
  prose?: Partial<SiteTheme['prose']>;
  syntax?: Partial<SiteTheme['syntax']>;
  segmentOverrides?: Record<string, string | null>;
}

export function validateThemeAdapterOptions(value: unknown, source: string): ThemeAdapterOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${source} must be an object.`);
  const options = value as ThemeAdapterOptions;
  const allowed = ['name', 'mode', 'chrome', 'prose', 'syntax', 'segmentOverrides'];
  for (const key of Object.keys(options)) if (!allowed.includes(key)) throw new Error(`Unknown ${source} field: ${key}`);
  if (options.mode !== undefined && !['light', 'dark'].includes(options.mode)) throw new Error(`Invalid mode in ${source}.`);
  if (options.name !== undefined && typeof options.name !== 'string') throw new Error(`Invalid name in ${source}.`);
  for (const key of ['chrome', 'prose', 'syntax', 'segmentOverrides'] as const) {
    if (options[key] !== undefined && (!options[key] || typeof options[key] !== 'object' || Array.isArray(options[key]))) throw new Error(`${source} ${key} must be an object.`);
  }
  if (options.segmentOverrides && Object.values(options.segmentOverrides).some(value => value !== null && typeof value !== 'string')) throw new Error(`${source} segmentOverrides values must be strings or null.`);
  return options;
}

function rgb(color: string): number[] {
  let hex = color.slice(1);
  if (hex.length <= 4) hex = [...hex].map(char => char + char).join('');
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}
function luminance(color: string): number {
  return rgb(color).map(value => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
function mix(a: string, b: string, amount: number): string {
  const other = rgb(b);
  return '#' + rgb(a).map((value, index) => Math.round(value * (1 - amount) + other[index] * amount).toString(16).padStart(2, '0')).join('');
}
function readable(color: string, background: string): string {
  const bg = luminance(background);
  const target = bg > .4 ? '#000000' : '#ffffff';
  for (let step = 0; step <= 20; step++) {
    const candidate = step ? mix(color, target, step / 20) : color;
    const fg = luminance(candidate);
    if ((Math.max(bg, fg) + .05) / (Math.min(bg, fg) + .05) >= 4.5) return candidate;
  }
  return target;
}

export function adaptOhMyPoshTheme(parsed: PromptTheme, options: ThemeAdapterOptions = {}): SiteTheme {
  const p = parsed.palette;
  const color = (...values: unknown[]) => values.map(value => resolveColor(value, p)).find(value => value && value !== 'transparent');
  const segments = parsed.lines.flatMap(line => line.segments);
  const colors = [...new Set([
    ...Object.values(p), ...segments.flatMap(segment => [segment.foreground, segment.background,
      ...[segment.template, ...(segment.templates || []), segment.leadingSymbol || '', segment.trailingSymbol || '',
        ...segment.foregroundTemplates, ...segment.backgroundTemplates].flatMap(text =>
        [...text.matchAll(/#[\da-f]{3,8}\b|p:[\w-]+/gi)].map(match => color(match[0]))),
    ]),
  ].filter((value): value is string => !!color(value)))];
  const bg = color(options.chrome?.background, parsed.background, p.bg, p.background) || (options.mode === 'light' ? '#f6f5f2' : '#17191f');
  const mode = options.mode || (luminance(bg) > .4 ? 'light' : 'dark');
  const fg = readable(color(options.chrome?.foreground, p.fg, p.foreground,
    segments.find(segment => segment.type === 'session')?.foreground) || (mode === 'light' ? '#24262b' : '#e6e6e6'), bg);
  const byHue = (degrees: number) => {
    const scored = colors.flatMap(value => {
      const [r, g, b] = rgb(value).map(channel => channel / 255);
      const max = Math.max(r, g, b); const delta = max - Math.min(r, g, b);
      if (delta < .12) return [];
      const hue = ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 + 360) % 360;
      const distance = Math.abs(hue - degrees);
      return [{ value, distance: Math.min(distance, 360 - distance) }];
    }).sort((a, b) => a.distance - b.distance);
    return scored[0]?.value;
  };
  const accent = readable(color(options.chrome?.accent, p.blue, p.accent, byHue(220)) || fg, bg);
  const muted = readable(color(options.chrome?.muted, p['fg-soft'], p.muted) || mix(fg, bg, .25), bg);
  const terminal = options.segmentOverrides ? {
    ...parsed,
    lines: parsed.lines.map(line => ({ ...line, segments: line.segments.flatMap(segment => {
      const override = options.segmentOverrides?.[segment.alias || segment.type];
      if (override === null) return [];
      return [{ ...segment, ...(typeof override === 'string' ? { type: 'text', template: override, templates: [] } : {}) }];
    }) })),
  } : parsed;
  // Fill semantic tokens from any palette or inline segment colors; no Tokyo-specific defaults.
  const palette = {
    ...p, fg, bg, 'fg-soft': muted,
    blue: accent,
    magenta: readable(color(p.magenta, p.purple, byHue(290)) || accent, bg),
    green: readable(color(p.green, segments.find(segment => segment.type === 'status')?.foreground, byHue(120)) || fg, bg),
    red: readable(color(p.red, ...segments.filter(segment => segment.type === 'status').flatMap(segment =>
      segment.foregroundTemplates.flatMap(template => [...template.matchAll(/#[\da-f]{3,8}\b/gi)].map(match => match[0])))) || (mode === 'dark' ? '#ff8787' : '#a52945'), bg),
    cyan: readable(color(p.cyan, p.teal, byHue(180)) || accent, bg),
    yellow: readable(color(p.yellow, p.orange, byHue(50)) || accent, bg),
    surface: color(options.chrome?.border, p.surface) || mix(bg, fg, .18),
  };
  const codeBackground = color(options.prose?.codeBackground, p['bg-dark']) || mix(bg, fg, .04);
  const syntax = {
    comment: muted, string: palette.green, keyword: palette.magenta,
    constant: palette.yellow, function: accent, parameter: fg,
  };
  for (const key of Object.keys(syntax) as (keyof typeof syntax)[]) syntax[key] = readable(color(options.syntax?.[key]) || syntax[key], codeBackground);
  return {
    id: options.id || 'theme', name: options.name || 'Theme', mode,
    terminal, palette,
    chrome: { background: bg, foreground: fg, muted, border: palette.surface, accent },
    prose: {
      foreground: readable(color(options.prose?.foreground) || fg, bg),
      muted: readable(color(options.prose?.muted) || muted, bg),
      link: readable(color(options.prose?.link, p.cyan) || accent, bg),
      codeBackground,
    }, syntax,
  };
}

export function themeTokens(theme: SiteTheme): Record<string, string> {
  const p = theme.palette;
  return {
    '--site-bg': theme.chrome.background, '--site-fg': theme.chrome.foreground,
    '--site-muted': theme.chrome.muted, '--chrome-bg': theme.chrome.background,
    '--chrome-border': theme.chrome.border, '--chrome-accent': theme.chrome.accent,
    '--terminal-bg': theme.chrome.background, '--terminal-fg': p.fg,
    '--terminal-accent-1': p.blue, '--terminal-accent-2': p.magenta,
    '--terminal-success': p.green, '--terminal-error': p.red,
    '--terminal-cyan': p.cyan, '--terminal-yellow': p.yellow, '--terminal-surface': p.surface,
    '--prose-fg': theme.prose.foreground, '--prose-muted': theme.prose.muted,
    '--prose-link': theme.prose.link, '--prose-code-bg': theme.prose.codeBackground,
    '--shiki-foreground': theme.prose.foreground, '--shiki-background': theme.prose.codeBackground,
    ...Object.fromEntries(Object.entries(theme.syntax).map(([key, value]) => [`--shiki-token-${key}`, value])),
    '--shiki-token-string-expression': theme.syntax.string, '--shiki-token-punctuation': theme.prose.foreground,
    '--shiki-token-link': theme.prose.link,
    ...Object.fromEntries(['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].flatMap(key => {
      const value = key === 'black' ? theme.prose.codeBackground : key === 'white' ? theme.prose.foreground : p[key];
      return [[`--shiki-ansi-${key}`, value], [`--shiki-ansi-bright-${key}`, value]];
    })),
  };
}
