import { listChildren, resolvePath, virtualPath, type SiteEntry } from '../navigation/filesystem';
import { searchEntries } from '../search';
import { tokenize } from './parser';
import { runFastfetch, type FastfetchContext, type FastfetchResult } from './fastfetch';
import type { FriendLink } from '../../config';

export type CommandResult =
  | { kind: 'text' | 'error'; text: string }
  | { kind: 'list'; entries: SiteEntry[]; heading?: string }
  | { kind: 'rich'; rows: { label: string; value: string; path?: string }[] }
  | FastfetchResult
  | { kind: 'navigation'; path: string }
  | { kind: 'external'; url: string; name: string }
  | { kind: 'clear' | 'back' };

export interface CommandContext extends FastfetchContext {
  cwd: string;
  previousPath: string | null;
  friends: FriendLink[];
  theme: { current: { id: string }; set: (name: string) => boolean; available: { id: string; name: string }[] };
}
export interface CommandDefinition {
  name: string;
  usage: string;
  description: string;
  touchShortcut?: boolean;
  execute: (args: string[], context: CommandContext) => CommandResult;
}
const text = (value: string): CommandResult => ({ kind: 'text', text: value });
const error = (value: string): CommandResult => ({ kind: 'error', text: value });
function navigate(args: string[], ctx: CommandContext): CommandResult {
  if (args.length > 1) return error('Use a single path, such as cd ~/projects.');
  const target = args[0] || '~';
  const entry = resolvePath(target, ctx.cwd, ctx.entries, ctx.previousPath);
  if (!entry) return error(target === '-' ? 'There is no previous site path yet.' : `No page at ${target}. Try ls or search.`);
  return { kind: 'navigation', path: entry.path };
}

export const commands: CommandDefinition[] = [
  { name: 'help', usage: 'help', description: 'Show the way around.', touchShortcut: true, execute: () => ({ kind: 'rich', rows: commands.map(command => ({ label: command.usage, value: command.description })) }) },
  { name: 'pwd', usage: 'pwd', description: 'Print the current path.', execute: (_, ctx) => text(virtualPath(ctx.cwd)) },
  { name: 'ls', usage: 'ls [path]', description: 'List pages in a directory.', execute: (args, ctx) => {
    if (args.length > 1) return error('Usage: ls [path]');
    const entry = resolvePath(args[0] || '.', ctx.cwd, ctx.entries, ctx.previousPath);
    if (!entry) return error('That path does not exist.');
    const children = listChildren(entry.path, ctx.entries);
    return children.length ? { kind: 'list', entries: children } : text(`No child pages at ${virtualPath(entry.path)}.`);
  } },
  { name: 'cd', usage: 'cd <path>', description: 'Go to a page. Supports .., ~, and -.', execute: navigate },
  { name: 'open', usage: 'open <target>', description: 'Open a path or a named page.', execute: (args, ctx) => {
    if (!args.length) return error('Usage: open <path or page title>');
    const target = args.join(' ');
    const exact = resolvePath(target, ctx.cwd, ctx.entries, ctx.previousPath);
    const matches = exact ? [exact] : ctx.entries.filter(entry => (entry.title.toLowerCase() === target.toLowerCase() || entry.path.split('/').at(-1) === target));
    if (matches.length === 1) return { kind: 'navigation', path: matches[0].path };
    if (matches.length > 1) return { kind: 'list', entries: matches, heading: 'Choose a page' };
    return error(`No page named ${target}. Try search ${target}.`);
  } },
  { name: 'back', usage: 'back', description: 'Return through browser history.', execute: () => ({ kind: 'back' }) },
  { name: 'home', usage: 'home', description: 'Return to ~.', execute: () => ({ kind: 'navigation', path: '/' }) },
  { name: 'search', usage: 'search <query>', description: 'Search the whole site, including article text.', execute: (args, ctx) => {
    if (!args.join(' ').trim()) return error('Usage: search <query>');
    const results = searchEntries(args.join(' '), ctx.entries);
    return results.length ? { kind: 'list', entries: results, heading: `${results.length} ${results.length === 1 ? 'result' : 'results'}` } : text('No matching pages. Try another word.');
  } },
  { name: 'fastfetch', usage: 'fastfetch', description: 'USER · SYSTEM · ACTIVITY · NETWORK.', touchShortcut: true, execute: runFastfetch },
  { name: 'ssh', usage: 'ssh [friend]', description: 'List friend links or visit a friend’s website.', execute: (args, ctx) => {
    if (args.length > 1) return error('Usage: ssh [friend]');
    if (!args.length) return ctx.friends.length ? { kind: 'rich', rows: ctx.friends.map(friend => ({ label: friend.alias, value: `${friend.name}${friend.description ? ` · ${friend.description}` : ''}`, path: friend.url })) } : text('No friend links yet.');
    const friend = ctx.friends.find(friend => friend.alias.toLowerCase() === args[0].toLowerCase());
    if (!friend) return error(`Unknown friend: ${args[0]}. Type ssh to list connections.`);
    try {
      const url = new URL(friend.url);
      if (!['https:', 'http:'].includes(url.protocol)) return error('This friend link needs an HTTP or HTTPS address.');
      return { kind: 'external', url: url.href, name: friend.name };
    } catch { return error('This friend link needs a valid website address.'); }
  } },
  { name: 'theme', usage: 'theme [name]', description: 'List themes or change appearance.', execute: (args, ctx) => {
    if (args.length > 1) return error('Usage: theme [name]');
    if (!args.length) return { kind: 'rich', rows: ctx.theme.available.map(theme => ({ label: theme.id, value: `${theme.name}${theme.id === ctx.theme.current.id ? ' · current' : ''}` })) };
    return ctx.theme.set(args[0]) ? text(`Theme set to ${args[0]}.`) : error(`Unknown theme. Choose ${ctx.theme.available.map(theme => theme.id).join(' or ')}.`);
  } },
  { name: 'clear', usage: 'clear', description: 'Clear this command surface.', execute: () => ({ kind: 'clear' }) },
];

export function executeCommand(input: string, context: CommandContext): CommandResult {
  try {
    const [name, ...args] = tokenize(input);
    if (!name) return text('');
    const command = commands.find(command => command.name === name);
    if (!command) return error(`Unknown command: ${name}. Type help to see available commands.`);
    return command.execute(args, context);
  } catch (cause) { return error(cause instanceof Error ? cause.message : 'Could not read that command.'); }
}
