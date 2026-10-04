export interface SiteEntry {
  path: string;
  title: string;
  description: string;
  kind: 'page' | 'directory';
  tags: string[];
  date?: string;
  updated?: string;
  example?: boolean;
  searchText?: string;
  order?: number;
}

export const virtualPath = (path: string) => path === '/' ? '~' : `~${path}`;

// Pages are built as about.html and index.html (and may be visited that way); their routes are /about and /.
export function pathFromUrl(pathname: string): string {
  let path = pathname;
  try { path = decodeURIComponent(pathname); } catch { /* Keep the raw path. */ }
  return path.replace(/(?:\/index)?\.html$/, '').replace(/\/$/, '') || '/';
}

export function normalizePath(value: string, cwd = '/'): string {
  const input = value.trim();
  const absolute = input.startsWith('/') || input === '~' || input.startsWith('~/');
  const parts = absolute ? [] : cwd.split('/').filter(Boolean);
  for (const part of input.replace(/^~(?=\/|$)/, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return '/' + parts.join('/');
}

export function resolvePath(target: string, cwd: string, entries: SiteEntry[], previousPath: string | null = null): SiteEntry | undefined {
  const path = target === '-' ? previousPath : normalizePath(target, cwd);
  return entries.find(entry => entry.path === path);
}

export function listChildren(path: string, entries: SiteEntry[]): SiteEntry[] {
  return entries.filter(entry => entry.path !== path && normalizePath('..', entry.path) === path);
}

export function breadcrumbs(path: string): { label: string; path: string }[] {
  const parts = path.split('/').filter(Boolean);
  return [{ label: '~', path: '/' }, ...parts.map((label, index) => ({ label, path: '/' + parts.slice(0, index + 1).join('/') }))];
}
