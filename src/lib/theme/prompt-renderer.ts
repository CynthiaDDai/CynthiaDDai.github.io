import { resolveColor, type PromptColors } from './omp-parser';
import type { PromptContext, PromptTheme } from './types';
import { escapeHtml as escape, expandTemplate } from './template';

const decorations: Record<string, { tag: string; style?: string }> = {
  b: { tag: 'strong' }, i: { tag: 'em' },
  u: { tag: 'span', style: 'text-decoration:underline' },
  o: { tag: 'span', style: 'text-decoration:overline' },
  s: { tag: 'span', style: 'text-decoration:line-through' },
  d: { tag: 'span', style: 'opacity:0.65' },
};

function literalMarkup(value: string): string {
  // Decode context escaping only after splitting theme markup, so context
  // values cannot introduce a color tag or HTML.
  const literal = value.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => ({
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  }[entity]!));
  return escape(literal).replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]+/gu,
    glyphs => `<span class="prompt-glyph" aria-hidden="true">${glyphs}</span>`);
}

function colorStyle(foreground?: string, background?: string): string {
  // OMP's transparent foreground draws a cutout in the colored background.
  if (foreground === 'transparent') {
    if (background === 'transparent') return 'display:none';
    foreground = 'var(--terminal-bg)';
  }
  return [foreground && `color:${foreground}`, background && `background:${background}`].filter(Boolean).join(';');
}

function safeMarkup(value: string, palette: Record<string, string>, colors: PromptColors, defaults = colors): string {
  let output = '';
  const open: { name: string; tag: string }[] = [];
  for (const part of value.split(/(<[^>]*>)/)) {
    const decoration = part.match(/^<([biuosd])>$/)?.[1];
    const closing = part === '</>' ? 'color' : part.match(/^<\/([biuosd])>$/)?.[1];
    if (decoration) {
      const { tag, style } = decorations[decoration];
      output += `<${tag}${style ? ` style="${style}"` : ''}>`;
      open.push({ name: decoration, tag });
      continue;
    }
    if (closing) {
      const index = open.findLastIndex(item => item.name === closing);
      if (index >= 0) while (open.length > index) output += `</${open.pop()!.tag}>`;
      continue;
    }
    const anchor = part.match(/^<([^<>]*)>$/);
    if (anchor) {
      const [fg, bg, extra] = anchor[1].split(',');
      const foreground = fg ? resolveColor(fg, palette, colors) : defaults.foreground;
      const background = bg ? resolveColor(bg, palette, colors) : defaults.background;
      if (extra === undefined && (fg || bg) && (!fg || foreground) && (!bg || background)) {
        output += `<span style="${colorStyle(foreground, background)}">`;
        open.push({ name: 'color', tag: 'span' });
        continue;
      }
    }
    output += literalMarkup(part);
  }
  while (open.length) output += `</${open.pop()!.tag}>`;
  return output;
}

export function renderPrompt(theme: PromptTheme, context: PromptContext): { alignment: 'left' | 'right'; html: string }[] {
  const lines: { alignment: 'left' | 'right'; html: string }[] = [];
  let hasPath = false;
  const pathMarkup = () => context.pathLinks?.length ?
    `<span class="prompt-path" role="navigation" aria-label="Breadcrumb">${context.pathLinks.map((link, index, all) =>
      `${index ? '<span class="path-separator" aria-hidden="true">/</span>' : ''}<a href="${escape(link.path)}"${index === all.length - 1 ? ' aria-current="page"' : ''}>${escape(link.label)}</a>`).join('')}</span>` : escape(context.cwd);
  for (const line of theme.lines) {
    let parent: PromptColors = {};
    const segments = line.segments.flatMap(segment => {
      if (!['text', 'session', 'path', 'status', 'time'].includes(segment.type)) return [];
      let expanded = '';
      if (segment.templates?.length) {
        for (const template of segment.templates) {
          const text = expandTemplate(template, context, segment.properties);
          if (!text.trim()) continue;
          expanded += text;
          if (segment.templatesLogic === 'first_match') break;
        }
      } else expanded = expandTemplate(segment.template, context, segment.properties);
      if (!expanded.trim() && !segment.force && segment.style !== 'accordion') return [];
      const colors: PromptColors = { parentForeground: parent.foreground, parentBackground: parent.background };
      const dynamicColor = (templates: string[], source?: string, fallback?: string) => {
        for (const template of templates) {
          const value = expandTemplate(template, context, segment.properties).trim();
          if (value) return resolveColor(value, theme.palette, colors) || fallback;
        }
        return resolveColor(source, theme.palette, colors) || fallback;
      };
      colors.foreground = dynamicColor(segment.foregroundTemplates, segment.foregroundSource, segment.foreground);
      colors.background = dynamicColor(segment.backgroundTemplates, segment.backgroundSource, segment.background);
      parent = colors;
      return [{ segment, expanded, colors }];
    });
    const html = segments.map(({ segment, expanded, colors }, index) => {
      let markup = safeMarkup(expanded, theme.palette, colors);
      if (!hasPath && segment.type === 'path' && context.cwd && markup.includes(escape(context.cwd))) {
        markup = markup.replace(escape(context.cwd), pathMarkup);
        hasPath = true;
      }
      const previous = segments[index - 1];
      const next = segments[index + 1];
      const isPowerline = (style?: string) => style === 'powerline' || style === 'accordion';
      const powerline = isPowerline(segment.style);
      const symbol = (value: string | undefined, foreground: string, background = 'transparent', invert = false) => {
        if (!value) return '';
        if (invert) [foreground, background] = [background, foreground];
        const style = colorStyle(foreground, background);
        return `<span class="prompt-symbol" style="${style}">${safeMarkup(expandTemplate(value, context, segment.properties), theme.palette,
          colors, { foreground, background })}</span>`;
      };
      let leading = '';
      let trailing = '';
      if (powerline && segment.leadingSymbol && !isPowerline(previous?.segment.style)) {
        leading = symbol(segment.leadingSymbol, colors.background || 'transparent');
      } else if (powerline || isPowerline(previous?.segment.style)) {
        // OMP uses the incoming segment's powerline symbol at a boundary.
        const value = powerline ? segment.trailingSymbol : previous?.segment.trailingSymbol;
        const previousBackground = previous && (isPowerline(previous.segment.style) ||
          (previous.segment.style === 'diamond' && !previous.segment.trailingSymbol)) ? previous.colors.background : undefined;
        const background = powerline || (segment.style === 'diamond' && !segment.leadingSymbol) ? colors.background : undefined;
        leading = symbol(value, previousBackground || 'transparent', background || 'transparent',
          segment.invertPowerline || previous?.segment.invertPowerline);
      }
      if (segment.style === 'diamond') {
        const background = previous?.segment.style === 'diamond' && !previous.segment.trailingSymbol ? previous.colors.background : undefined;
        leading += symbol(segment.leadingSymbol, colors.background || 'transparent', background || 'transparent');
        const nextBackground = next?.segment.style === 'diamond' && !next.segment.leadingSymbol ? next.colors.background : undefined;
        trailing = symbol(segment.trailingSymbol, colors.background || 'transparent', nextBackground || 'transparent');
      } else if (powerline && !next) {
        trailing = symbol(segment.trailingSymbol, colors.background || 'transparent', 'transparent', segment.invertPowerline);
      }
      return leading + `<span class="prompt-segment segment-${segment.style}" style="${colorStyle(colors.foreground, colors.background)}">${markup}</span>` + trailing;
    }).join('');
    if (!html) continue;
    if (!line.newline && lines.at(-1)?.alignment === line.alignment) lines.at(-1)!.html += html;
    else lines.push({ alignment: line.alignment, html });
  }
  // Navigation and a left-aligned input remain available even in themes without a path segment.
  if (!hasPath) lines.push({ alignment: 'left', html: `${pathMarkup()} ❯ ` });
  else if (lines.at(-1)?.alignment === 'right') lines.push({ alignment: 'left', html: '❯ ' });
  return lines;
}

// A card is a prompt for one item (a page, a work, a file): the theme's transient prompt, with the item's name as a
// shortened path (…/name) and its state as git fields. A transient prompt that leaves out the path is followed by the
// name, as the command typed after it, so the item stays identifiable.
export function renderCardPrompt(theme: PromptTheme, name: string, git?: PromptContext['git']): string {
  const path = `…/${name}`;
  const title = `<span class="card-title-text">${escape(name)}</span>`;
  const html = renderPrompt({ ...theme, lines: [{ alignment: 'left', newline: true, segments: theme.transient ? [theme.transient] : [] }] },
    { user: '', host: '', cwd: path, status: 'ok', git })[0].html;
  // Without a transient template, the fallback is the path and ❯.
  return html.includes(escape(path)) ? html.replace(escape(path), `…/${title}`) : `${html}<span class="card-command">${title}</span>`;
}
