import type { SiteEntry } from '../navigation/filesystem';

// Keep prose and code searchable, without indexing markup or MDX imports.
export function searchableText(source: string): string {
  return source.replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^(?:import|export) .+$/gm, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`#*_]/g, '')
    .replace(/\s+/g, ' ').trim();
}

export function searchEntries(query: string, entries: SiteEntry[]): SiteEntry[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return entries.map(entry => {
    const title = entry.title.toLocaleLowerCase();
    const tags = entry.tags.join(' ').toLocaleLowerCase();
    const text = `${title} ${entry.description} ${tags} ${entry.path} ${entry.searchText ?? ''}`.toLocaleLowerCase();
    const score = terms.every(term => text.includes(term))
      ? terms.reduce((sum, term) => sum + (title.includes(term) ? 4 : tags.includes(term) ? 2 : 1), 0) : 0;
    return { entry, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path)).map(item => item.entry);
}
