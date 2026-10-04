import { resolveSiteUrl, checkReleaseUrl } from './site-url.mjs';

const url = resolveSiteUrl(process.cwd(), 'production');
checkReleaseUrl(url);
console.log(`Public site URL: ${url}`);
