import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry =>
    entry.isDirectory() ? htmlFiles(join(directory, entry.name)) : entry.name.endsWith('.html') ? [join(directory, entry.name)] : []);
}

// Every internal href/src in the built HTML must resolve to a file in dist, as a static server would.
export function findBrokenLinks(dist = 'dist') {
  const broken = [];
  for (const file of htmlFiles(dist)) {
    const page = '/' + relative(dist, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
    const html = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
    for (const [, value] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      const link = value.replaceAll('&amp;', '&');
      if (!link || link.startsWith('#') || link.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
      let path = new URL(link, `https://site.invalid${page}`).pathname;
      try { path = decodeURIComponent(path); } catch { /* Keep the raw path; it will not match a file. */ }
      const target = join(dist, path);
      if (![target, join(target, 'index.html'), `${target}.html`].some(candidate => existsSync(candidate) && statSync(candidate).isFile())) {
        broken.push({ page, link });
      }
    }
  }
  return broken;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const broken = findBrokenLinks(process.argv[2] ?? process.env.SITE_OUT_DIR ?? 'dist');
  if (broken.length) {
    console.error(`Broken internal links (use absolute site paths such as /notes/first-post):\n${broken.map(({ page, link }) => `  ${page} → ${link}`).join('\n')}`);
    process.exit(1);
  }
  console.log('Internal links: all resolve.');
}
