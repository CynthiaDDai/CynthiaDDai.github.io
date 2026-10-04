import type { SiteEntry } from '../navigation/filesystem';
import { listChildren } from '../navigation/filesystem';
import type { FastfetchTheme } from '../theme/fastfetch-parser';
import type { SocialLink } from '../../config';

export interface FastfetchRow { label: string; value: string; path?: string; }
export interface FastfetchSection { name: 'USER' | 'SYSTEM' | 'ACTIVITY' | 'NETWORK'; rows: FastfetchRow[]; }
export interface FastfetchContext {
  entries: SiteEntry[];
  owner: string;
  host: string;
  bio: string;
  email: string;
  github: string;
  socials: SocialLink[];
  activityLimit: number;
  fastfetch: FastfetchTheme;
}
export interface FastfetchResult { kind: 'fastfetch'; sections: FastfetchSection[]; theme: FastfetchTheme; }

export function runFastfetch(args: string[], ctx: FastfetchContext): FastfetchResult | { kind: 'error'; text: string } {
  if (args.length) return { kind: 'error', text: 'Usage: fastfetch' };
  const directories = listChildren('/', ctx.entries).filter(entry => entry.kind === 'directory');
  const updated = ctx.entries.filter(entry => entry.kind === 'page' && entry.date && !entry.example)
    .sort((a, b) => (b.updated || b.date || '').localeCompare(a.updated || a.date || '') || a.path.localeCompare(b.path))
    .slice(0, Math.max(1, Math.min(10, ctx.activityLimit)));
  return {
    kind: 'fastfetch', theme: ctx.fastfetch,
    sections: [
      { name: 'USER', rows: [
        { label: 'name', value: ctx.owner, path: ctx.entries.some(entry => entry.path === '/about') ? '/about' : undefined },
        { label: 'bio', value: ctx.bio },
      ] },
      { name: 'SYSTEM', rows: [
        { label: 'pages', value: String(ctx.entries.length) },
        ...directories.map(directory => ({ label: directory.path.slice(1), value: String(ctx.entries.filter(entry => entry.kind === 'page' && entry.path.startsWith(`${directory.path}/`)).length), path: directory.path })),
      ] },
      { name: 'ACTIVITY', rows: updated.length ? updated.map(entry => ({
        label: (entry.updated || entry.date || '').slice(0, 10), value: entry.title, path: entry.path,
      })) : [{ label: 'updates', value: 'No published updates yet.' }] },
      { name: 'NETWORK', rows: [
        ...(ctx.email ? [{ label: 'email', value: ctx.email, path: `mailto:${ctx.email}` }] : []),
        ...(ctx.github ? [{ label: 'github', value: 'GitHub ↗', path: ctx.github }] : []),
        ...ctx.socials.map(link => ({ label: link.name.toLowerCase(), value: `${link.name} ↗`, path: link.url })),
        ...(ctx.entries.some(entry => entry.path === '/contact') ? [{ label: 'contact', value: 'Get in touch', path: '/contact' }] : []),
        { label: 'feed', value: 'RSS ↗', path: '/rss.xml' },
      ] },
    ],
  };
}
