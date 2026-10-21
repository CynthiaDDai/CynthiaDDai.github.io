// Markdown with $…$ and $$…$$ math, rendered in the browser as it is typed.
// The site's own Markdown is rendered at build time, so the timer brings its own small renderer.
import { Marked, type Token, type TokensList } from 'marked';
import katex from 'katex';

const math = (tex: string, displayMode: boolean) => katex.renderToString(tex, { displayMode, throwOnError: false });

const markdown = new Marked({
  gfm: true,
  breaks: true, // a line break in the text is a line break on screen
  extensions: [
    {
      name: 'blockMath', level: 'block',
      start: src => src.match(/^\$\$/m)?.index,
      tokenizer(src) {
        const match = /^\$\$([\s\S]+?)\$\$[^\S\n]*(?:\n|$)/.exec(src);
        if (match) return { type: 'blockMath', raw: match[0], text: match[1].trim() };
      },
      renderer: token => math(token.text, true),
    },
    {
      name: 'inlineMath', level: 'inline',
      start: src => src.match(/(?<!\\)\$/)?.index,
      tokenizer(src) {
        const match = /^\$\$((?:\\.|[^\\$])+?)\$\$/.exec(src) ?? /^\$((?:\\.|[^\\$\n])+?)\$/.exec(src);
        if (match) return { type: 'inlineMath', raw: match[0], text: match[1].trim(), display: match[0].startsWith('$$') };
      },
      renderer: token => math(token.text, token.display),
    },
  ],
});

export interface Block { start: number; end: number; html: string; }

// The text cut into top-level blocks (paragraphs, lists, headings, display math), each with its place in the source,
// so one block can be edited as source while the others stay rendered. Blank lines between blocks belong to none.
export function blocks(source: string): Block[] {
  const tokens = markdown.lexer(source);
  if (tokens.map(token => token.raw).join('') !== source) {
    // The lexer normalised something (tabs, line endings): edit the whole text as one block.
    return source.trim() ? [{ start: 0, end: source.length, html: render(tokens, tokens) }] : [];
  }
  const result: Block[] = [];
  let offset = 0;
  for (const token of tokens) {
    const start = offset;
    offset += token.raw.length;
    if (token.type === 'space' || !token.raw.trim()) continue;
    result.push({ start, end: start + token.raw.trimEnd().length, html: render([token], tokens) });
  }
  return result;
}

function render(list: Token[], all: TokensList): string {
  return markdown.parser(Object.assign(list, { links: all.links }) as TokensList) as string;
}
