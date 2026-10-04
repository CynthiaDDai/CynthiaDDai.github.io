import type { SiteEntry } from '../navigation/filesystem';
import { listChildren, normalizePath } from '../navigation/filesystem';
import { commands } from './registry';

export interface CompletionOptions { friends?: string[]; }

export function autocomplete(input: string, cwd: string, entries: SiteEntry[], themeIds: string[], options: CompletionOptions = {}): string[] {
  const value = input.trimStart();
  if (!value.includes(' ')) {
    if (['cd', 'ls', 'open', 'theme', 'ssh'].includes(value)) return autocomplete(`${value} `, cwd, entries, themeIds, options);
    return commands.map(command => command.name).filter(name => name.startsWith(value));
  }
  const match = value.match(/^(\S+)\s+(.*)$/);
  if (!match) return [];
  const [, command, argument] = match;
  if (command === 'theme') return themeIds.filter(id => id.startsWith(argument)).map(id => `theme ${id}`);
  if (command === 'ssh') return (options.friends ?? []).filter(alias => alias.startsWith(argument)).map(alias => `ssh ${alias}`);
  if (!['cd', 'ls', 'open'].includes(command)) return [];
  if (argument === '~') return [`${command} ~/`];
  const slash = argument.lastIndexOf('/');
  const prefix = slash >= 0 ? argument.slice(0, slash + 1) : '';
  const fragment = argument.slice(slash + 1);
  const parent = normalizePath(prefix || '.', cwd);
  return listChildren(parent, entries)
    .filter(entry => entry.path.split('/').at(-1)!.startsWith(fragment))
    .map(entry => `${command} ${prefix}${entry.path.split('/').at(-1)!}${entry.kind === 'directory' ? '/' : ''}`).sort();
}

export function commonCompletionPrefix(values: string[]): string {
  if (!values.length) return '';
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}
