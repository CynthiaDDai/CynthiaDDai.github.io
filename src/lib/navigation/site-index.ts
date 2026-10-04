import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import { buildContentTree, ignoredContentName, invalidContentPaths, type ContentTree } from '../content/tree';
import { siteConfigErrors } from '../site-config';
import { site } from '../../config';

const contentDirectory = process.env.SITE_CONTENT_DIR || 'src/content';
const contentRoot = () => join(process.cwd(), contentDirectory);

function contentFiles(root: string, path = ''): string[] {
  return readdirSync(join(root, path), { withFileTypes: true }).filter(entry => !ignoredContentName(entry.name)).flatMap(entry => {
    const child = path ? `${path}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return contentFiles(root, child);
    return /\.mdx?$/.test(entry.name) ? [child] : [];
  });
}

// The loader silently drops some names (such as c#.md), so names are checked against the real files.
function checkContentNames() {
  const invalid = invalidContentPaths(contentFiles(contentRoot()));
  if (invalid.length) {
    throw new Error(`Content names must use lowercase letters, digits and single hyphens (for example machine-learning/first-post.md). Rename, or prefix with _ to ignore:\n${invalid.map(file => `  ${contentDirectory}/${file}`).join('\n')}`);
  }
}

function checkSiteConfig() {
  const errors = siteConfigErrors(site);
  if (errors.length) throw new Error(`${process.env.SITE_PROFILE || 'src/config/site.json'}:\n${errors.map(error => `  ${error}`).join('\n')}`);
}

let snapshot: Promise<ContentTree> | undefined;

export function getContentTree(): Promise<ContentTree> {
  const load = async () => { checkSiteConfig(); checkContentNames(); return buildContentTree(await getCollection('content')); };
  if (import.meta.env.DEV) return load();
  return snapshot ??= load();
}

export async function getSiteIndex() {
  return (await getContentTree()).entries;
}
