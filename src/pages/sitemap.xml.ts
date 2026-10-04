import type { APIContext } from 'astro';
import { getSiteIndex } from '../lib/navigation/site-index';

// Built from the same content tree as every other listing.
export async function GET(context: APIContext) {
  const urls = (await getSiteIndex()).map(entry =>
    `<url><loc>${new URL(entry.path, context.site).href}</loc>${entry.updated ? `<lastmod>${entry.updated.slice(0, 10)}</lastmod>` : ''}</url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
