import rss from '@astrojs/rss';
import { getSiteIndex } from '../lib/navigation/site-index';
import type { APIContext } from 'astro';
import { site } from '../config';

// site.json `feed` lists the directories whose dated documents are syndicated.
export async function GET(context: APIContext) {
  const inFeed = (path: string) => site.feed.some(directory => directory === '/' || path.startsWith(`${directory}/`));
  const entries = (await getSiteIndex()).filter(entry => entry.kind === 'page' && inFeed(entry.path) && entry.date && !entry.example);
  return rss({ title: site.name, description: site.description, site: context.site!, trailingSlash: false,
    items: entries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.path.localeCompare(b.path)).map(entry => ({
      title: entry.title, description: entry.description, pubDate: new Date(entry.date!),
      link: entry.path, categories: entry.tags,
    })) });
}
