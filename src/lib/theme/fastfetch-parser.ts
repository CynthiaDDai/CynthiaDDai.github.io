export interface FastfetchSectionStyle { color: string; marker: string; }
export interface FastfetchTheme {
  separator: string;
  branch: string;
  lastBranch: string;
  sections: FastfetchSectionStyle[];
  logo?: { type: 'text' | 'image'; source: string };
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const plainIcon = (value: string) => value.replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu, '›');
const defaults = [
  { color: 'yellow', marker: '●' }, { color: 'blue', marker: '◇' },
  { color: 'green', marker: '↺' }, { color: 'magenta', marker: '↗' },
];

// JSONC comments and trailing commas, with quoted URLs and escape sequences intact.
export function parseJsonc(source: string): unknown {
  let output = '';
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') { quoted = true; output += char; }
    else if (char === '/' && source[i + 1] === '/') {
      while (i + 1 < source.length && source[i + 1] !== '\n') i++;
      output += ' ';
    } else if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Close the comment in config.jsonc.');
      i = end + 1; output += ' ';
    } else output += char;
  }
  let json = '';
  quoted = false; escaped = false;
  for (let i = 0; i < output.length; i++) {
    const char = output[i];
    if (!quoted && char === ',' && /^[\s]*[}\]]/.test(output.slice(i + 1))) continue;
    json += char;
    if (quoted && escaped) escaped = false;
    else if (quoted && char === '\\') escaped = true;
    else if (char === '"') quoted = !quoted;
  }
  return JSON.parse(json.replace(/^\uFEFF/, ''));
}

export function parseFastfetchTheme(source: string | unknown): FastfetchTheme {
  const raw = record(typeof source === 'string' ? parseJsonc(source) : source);
  const display = record(raw.display);
  const colors = record(display.color);
  const modules = Array.isArray(raw.modules) ? raw.modules.map(record) : [];
  // Only keys, colors, and branch geometry are read. Hardware modules and commands are never evaluated.
  const headings = modules.filter(module => typeof module.key === 'string' && !/[│├└]/.test(module.key));
  const branch = modules.find(module => typeof module.key === 'string' && module.key.includes('├'));
  const lastBranch = modules.find(module => typeof module.key === 'string' && module.key.includes('└'));
  const geometry = (value: unknown, fallback: string) => typeof value === 'string' ? value.match(/^[\s│├└─]+/)?.[0].trimEnd() || fallback : fallback;
  const rawLogo = record(raw.logo);
  const logo = rawLogo.type === 'data' && typeof rawLogo.source === 'string'
    ? { type: 'text' as const, source: plainIcon(rawLogo.source) }
    : typeof rawLogo.source === 'string' && rawLogo.source.startsWith('/') && !rawLogo.source.startsWith('//') && !rawLogo.source.startsWith('/nix/') && /\.(?:png|jpe?g|webp|gif|svg)$/i.test(rawLogo.source)
      ? { type: 'image' as const, source: rawLogo.source } : undefined;
  return {
    separator: plainIcon(typeof display.separator === 'string' ? display.separator : ' : '),
    branch: geometry(branch?.key, '│ ├'), lastBranch: geometry(lastBranch?.key, '│ └'),
    sections: defaults.map((fallback, index) => {
      const heading = headings[index] ?? {};
      const color = heading.keyColor ?? colors.keys;
      const marker = typeof heading.key === 'string' ? plainIcon(heading.key.trim().split(/\s+/)[0]) : fallback.marker;
      return { color: typeof color === 'string' ? color : fallback.color, marker: marker === '›' || /[a-z]/i.test(marker) ? fallback.marker : marker };
    }),
    ...(logo ? { logo } : {}),
  };
}

// Terminal color names follow the site's active palette, so both light and dark themes stay readable.
export function fastfetchColor(value: string): string {
  const colors: Record<string, string> = { yellow: '--terminal-yellow', blue: '--terminal-accent-1', green: '--terminal-success', magenta: '--terminal-accent-2', cyan: '--terminal-cyan', red: '--terminal-error', white: '--site-fg', black: '--site-muted', default: '--site-fg' };
  const token = colors[value.toLowerCase().replace(/^bright[-_]?/, '')];
  if (token) return `var(${token})`;
  return /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value) ? value : 'var(--terminal-accent-1)';
}
