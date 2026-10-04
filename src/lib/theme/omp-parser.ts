import type { PromptSegment, PromptTheme } from './types';
import { unsupportedExpressions } from './template';

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const validColor = (value: unknown): value is string => typeof value === 'string' &&
  /^(?:#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|transparent)$/i.test(value);

export interface PromptColors {
  foreground?: string;
  background?: string;
  parentForeground?: string;
  parentBackground?: string;
}

// ANSI names and numbered colors depend on the terminal palette. Use xterm's
// conventional palette when the theme does not supply an explicit RGB color.
const ansiNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'darkGray', 'lightRed', 'lightGreen', 'lightYellow', 'lightBlue', 'lightMagenta', 'lightCyan', 'lightWhite'];
const ansiColors = ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'];

export function resolveColor(value: unknown, palette: Record<string, string>, colors: PromptColors = {}, seen = new Set<string>()): string | undefined {
  if (validColor(value)) return value;
  if (typeof value !== 'string') return undefined;
  if (['foreground', 'background', 'parentForeground', 'parentBackground'].includes(value)) {
    return colors[value as keyof PromptColors];
  }
  const ansi = ansiNames.indexOf(value);
  if (ansi >= 0) return ansiColors[ansi];
  if (/^\d{1,3}$/.test(value)) {
    const index = Number(value);
    if (index < 16) return ansiColors[index];
    if (index < 232) {
      const cube = index - 16;
      const levels = [0, 95, 135, 175, 215, 255];
      return '#' + [Math.floor(cube / 36), Math.floor(cube / 6) % 6, cube % 6]
        .map(channel => levels[channel].toString(16).padStart(2, '0')).join('');
    }
    if (index < 256) return '#' + (8 + (index - 232) * 10).toString(16).padStart(2, '0').repeat(3);
    return undefined;
  }
  if (!value.startsWith('p:')) return undefined;
  const key = value.slice(2);
  if (seen.has(key)) return undefined;
  seen.add(key);
  return resolveColor(palette[key], palette, colors, seen);
}

export function parseOhMyPoshTheme(input: unknown): PromptTheme {
  const raw = record(input);
  if (!Array.isArray(raw.blocks)) throw new Error('An Oh My Posh theme must contain a blocks array.');
  const rawPalette = record(raw.palette);
  const palette: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawPalette)) {
    const color = resolveColor(value, rawPalette as Record<string, string>);
    if (color) palette[key] = color;
  }
  const warnings = new Set<string>();
  const defaults: Record<string, string> = {
    text: '', session: '{{ .UserName }}@{{ .HostName }}', path: '{{ .Path }}',
    status: '{{ if .Error }}[{{ .Code }}]{{ end }}', time: '{{ .CurrentDate | date .Format }}',
  };
  const lines = raw.blocks.flatMap((entry) => {
    const block = record(entry);
    if (block.type !== undefined && block.type !== 'prompt') return [];
    const segments = (Array.isArray(block.segments) ? block.segments : []).flatMap((entry): PromptSegment[] => {
      const segment = record(entry);
      if (typeof segment.type !== 'string') return [];
      if (!Object.hasOwn(defaults, segment.type)) warnings.add(`Omitted unsupported or environment-dependent segment: ${segment.type}`);
      if (segment.alias === 'NixShell') warnings.add('Omitted NixShell: browser prompts have no shell environment.');
      const style = ['plain', 'powerline', 'diamond', 'accordion', 'text'].includes(String(segment.style))
        ? segment.style as PromptSegment['style'] : 'plain';
      if (segment.style !== undefined && style !== segment.style) warnings.add(`Unsupported ${segment.type} style: ${segment.style}`);
      const template = typeof segment.template === 'string' ? segment.template : defaults[segment.type] || '';
      const templates = Array.isArray(segment.templates) ? segment.templates.filter((item): item is string => typeof item === 'string') : [];
      const foregroundTemplates = Array.isArray(segment.foreground_templates) ? segment.foreground_templates.filter((item): item is string => typeof item === 'string') : [];
      const backgroundTemplates = Array.isArray(segment.background_templates) ? segment.background_templates.filter((item): item is string => typeof item === 'string') : [];
      if (Object.hasOwn(defaults, segment.type)) {
        for (const value of [template, ...templates, ...foregroundTemplates, ...backgroundTemplates,
          String(segment.leading_diamond || segment.leading_powerline_symbol || ''),
          String(segment.trailing_diamond || segment.powerline_symbol || '')]) {
          for (const expr of unsupportedExpressions(value)) warnings.add(`Unsupported ${segment.type} template expression: ${expr}`);
        }
      }
      return [{
        type: segment.type,
        alias: typeof segment.alias === 'string' ? segment.alias : undefined,
        style,
        foreground: resolveColor(segment.foreground, palette),
        background: resolveColor(segment.background, palette),
        foregroundSource: typeof segment.foreground === 'string' ? segment.foreground : undefined,
        backgroundSource: typeof segment.background === 'string' ? segment.background : undefined,
        template, templates, foregroundTemplates, backgroundTemplates,
        templatesLogic: segment.templates_logic === 'first_match' ? 'first_match' : 'join',
        force: segment.force === true,
        leadingSymbol: style === 'diamond' && typeof segment.leading_diamond === 'string' ? segment.leading_diamond :
          ['powerline', 'accordion'].includes(style) && typeof segment.leading_powerline_symbol === 'string' ? segment.leading_powerline_symbol : undefined,
        trailingSymbol: style === 'diamond' && typeof segment.trailing_diamond === 'string' ? segment.trailing_diamond :
          ['powerline', 'accordion'].includes(style) && typeof segment.powerline_symbol === 'string' ? segment.powerline_symbol : undefined,
        invertPowerline: segment.invert_powerline === true,
        properties: { ...record(segment.properties), ...record(segment.options) },
      }];
    });
    return [{ alignment: block.alignment === 'right' ? 'right' as const : 'left' as const,
      newline: block.newline === true, segments }];
  });
  return { palette, lines, background: resolveColor(raw.terminal_background, palette), warnings: [...warnings] };
}
