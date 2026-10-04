import type { PromptContext } from './types';

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

const placeholders = new Set(['.UserName', '.HostName', '.Path', '.PWD', '.Folder', '.Code', '.CurrentDate | date .Format']);
const booleans = new Set(['.Root', '.SSHSession', '.Error']);
const comparison = /^(eq|ne|gt|ge|lt|le) \.Code (-?\d+)$/;
const expression = (piece: string) => piece.slice(2, -2).trim().replace(/^-\s+|\s+-$/g, '');

// Diagnostics and rendering share the same deliberately small Go-template subset.
export function unsupportedExpressions(template: string): string[] {
  return [...template.matchAll(/{{[\s\S]*?}}/g)].map(match => expression(match[0])).filter(expr => {
    if (expr === 'end' || expr === 'else') return false;
    const condition = expr.replace(/^(?:else )?if /, '');
    return !placeholders.has(expr) && !booleans.has(condition) && !comparison.test(condition);
  });
}

// Oh My Posh uses Go's reference-date layout, rather than strftime tokens.
function formatTime(layout: string, date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hour = date.getHours();
  const tokens: Record<string, string> = {
    '2006': String(date.getFullYear()), '06': pad(date.getFullYear() % 100),
    January: date.toLocaleDateString('en-US', { month: 'long' }), Jan: date.toLocaleDateString('en-US', { month: 'short' }),
    Monday: date.toLocaleDateString('en-US', { weekday: 'long' }), Mon: date.toLocaleDateString('en-US', { weekday: 'short' }),
    '01': pad(date.getMonth() + 1), '1': String(date.getMonth() + 1),
    '02': pad(date.getDate()), '2': String(date.getDate()),
    '15': pad(hour), '03': pad(hour % 12 || 12), '3': String(hour % 12 || 12),
    '04': pad(date.getMinutes()), '4': String(date.getMinutes()), '05': pad(date.getSeconds()), '5': String(date.getSeconds()),
    PM: hour < 12 ? 'AM' : 'PM', pm: hour < 12 ? 'am' : 'pm',
  };
  // Keep color tags intact (their hex digits are not date tokens).
  return layout.split(/(<[^>]*>)/).map(part => part.startsWith('<') ? part :
    part.replace(/2006|January|Monday|Jan|Mon|15|01|02|03|04|05|06|PM|pm|[1-5]/g, token => tokens[token])).join('');
}

export function expandTemplate(template: string, ctx: PromptContext, properties: Record<string, unknown> = {}): string {
  // Go's hyphen markers trim whitespace adjacent to an action.
  template = template.replace(/\s*{{-\s/g, '{{ ').replace(/\s-}}\s*/g, ' }}');
  const values: Record<string, string> = {
    '.UserName': ctx.user, '.HostName': ctx.host, '.Path': ctx.cwd, '.PWD': ctx.cwd,
    '.Folder': ctx.cwd.split('/').at(-1) || '~', '.Code': ctx.status === 'error' ? '1' : '0',
  };
  const conditions: Record<string, boolean> = { '.Root': false, '.SSHSession': false, '.Error': ctx.status === 'error' };
  const evaluate = (condition: string): boolean | undefined => {
    if (booleans.has(condition)) return conditions[condition];
    const match = condition.match(comparison);
    if (!match) return undefined;
    const a = Number(values['.Code']); const b = Number(match[2]);
    const comparisons: Record<string, boolean> = { eq: a === b, ne: a !== b, gt: a > b, ge: a >= b, lt: a < b, le: a <= b };
    return comparisons[match[1]];
  };
  const stack: { parent: boolean; known: boolean; matched: boolean }[] = [];
  let active = true;
  let output = '';
  for (const piece of template.split(/({{[\s\S]*?}})/)) {
    if (!piece.startsWith('{{')) { if (active) output += piece; continue; }
    const expr = expression(piece);
    if (expr.startsWith('if ')) {
      const result = evaluate(expr.slice(3).trim());
      stack.push({ parent: active, known: result !== undefined, matched: result === true });
      active = active && result === true;
    } else if (expr.startsWith('else')) {
      const frame = stack.at(-1);
      if (!frame) continue;
      if (expr.startsWith('else if ')) {
        const result = evaluate(expr.slice(8).trim());
        active = frame.parent && frame.known && !frame.matched && result === true;
        frame.matched ||= active;
      } else {
        active = frame.parent && frame.known && !frame.matched;
        frame.matched = true;
      }
    } else if (expr === 'end') {
      const frame = stack.pop();
      if (frame) active = frame.parent;
    } else if (active) {
      if (expr === '.CurrentDate | date .Format') {
        output += formatTime(typeof properties.time_format === 'string' ? properties.time_format : '15:04:05', ctx.now || new Date());
      } else if (Object.hasOwn(values, expr)) output += escapeHtml(values[expr]);
    }
  }
  return output;
}
