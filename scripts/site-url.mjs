import { loadEnv } from 'vite';

export function siteEnvironmentMode(args = process.argv.slice(2)) {
  const explicit = args.findIndex(value => value === '--mode');
  if (explicit >= 0 && args[explicit + 1]) return args[explicit + 1];
  const assigned = args.find(value => value.startsWith('--mode='));
  if (assigned) return assigned.slice('--mode='.length);
  // Astro loads its config before Vite sets NODE_ENV, so use the CLI command as well.
  return process.env.NODE_ENV || (args.includes('build') || args.includes('preview') ? 'production' : 'development');
}

export function resolveSiteUrl(directory = process.cwd(), mode = siteEnvironmentMode()) {
  const env = loadEnv(mode, directory, 'PUBLIC_');
  const value = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || 'https://example.com';
  let url;
  try { url = new URL(value); } catch { throw new Error('PUBLIC_SITE_URL must be an absolute HTTP or HTTPS origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('PUBLIC_SITE_URL must be an HTTP or HTTPS origin without a path, credentials, query or fragment.');
  }
  return url.origin;
}

export function checkReleaseUrl(value) {
  const url = new URL(value);
  if (['example.com', 'localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.hostname.endsWith('.example')) {
    throw new Error('Set PUBLIC_SITE_URL to your public domain before releasing.');
  }
}
