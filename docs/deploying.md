# Deploying

`npm run build` produces a plain static website in `dist/`. Production needs no Node.js, database or server-side code; any web server or static host can serve it.

## Requirements for any host

**Serve from the root of a domain.** The site must live at `https://ada.example.org/` or `https://ada.github.io/`, not under a path such as `https://ada.github.io/my-site/`. Internal links are absolute paths starting at `/`.

**Serve `page.html` at `/page`.** Pages are built as files, not folders:

```text
dist/
├── index.html          → /
├── about.html          → /about
├── blog.html           → /blog
├── blog/
│   └── first-post.html → /blog/first-post
├── 404.html
├── rss.xml
└── sitemap.xml
```

The server should answer `/blog/first-post` with `blog/first-post.html` without redirecting, and answer unknown paths with `404.html` and status 404. GitHub Pages, Netlify and Cloudflare Pages do both by default. Hosts that only understand `folder/index.html` would redirect to URLs with a trailing slash, which don't match the site's own links.

**Set the public address** when building, through `PUBLIC_SITE_URL` (see [Configuration](configuration.md#public-address)). GitHub Pages and the NixOS module do this for you.

## GitHub Pages

The repository includes `.github/workflows/deploy.yml`, which builds and publishes the site on every push to `main`.

1. Name the repository `<user>.github.io`, or plan to use a custom domain (see below).
2. Push the project to GitHub.
3. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Push to `main`, or run the workflow by hand from the Actions tab.

**Check:** the Actions tab shows a green "Deploy to GitHub Pages" run, and its deploy step links to the live site.

The workflow takes the public address from the Pages settings, so no `.env` file is needed. If the repository would be served under a path (any name other than `<user>.github.io` without a custom domain), the workflow stops with an error rather than publishing a broken site.

The separate `ci.yml` workflow runs the test suites on every push and pull request.

### Custom domain

1. In **Settings → Pages → Custom domain**, enter your domain, e.g. `ada.example.org`.
2. At your DNS provider, add the record GitHub shows: a `CNAME` to `<user>.github.io` for a subdomain, or GitHub's `A`/`AAAA` records for an apex domain such as `example.org`.
3. Once the certificate is issued, tick **Enforce HTTPS**.
4. Run the workflow again, so the build uses the new address.

With a custom domain, the repository can have any name.

## Other static hosts

On Netlify, Cloudflare Pages and similar hosts:

- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: 22.12 or newer
- Environment variable: `PUBLIC_SITE_URL=https://your-domain`

## Your own web server

Build locally, then copy `dist/` to the server:

```sh
npm run check:release
npm run build
rsync -a --delete dist/ server:/srv/website/
```

**Caddy:**

```caddy
ada.example.org {
  root * /srv/website
  encode zstd gzip
  try_files {path} {path}.html
  file_server {
    disable_canonical_uris
  }
  handle_errors {
    rewrite * /404.html
    file_server
  }
}
```

**Nginx:**

```nginx
server {
  server_name ada.example.org;
  root /srv/website;
  location / {
    try_files $uri $uri.html =404;
  }
  error_page 404 /404.html;
}
```

Files under `/_astro/` have content hashes in their names and can be cached for a year (`Cache-Control: public, max-age=31536000, immutable`).

## NixOS with Caddy

The repository is also a Nix package and a NixOS module.

Build the static package:

```sh
nix-build default.nix --argstr siteUrl https://ada.example.org
```

The files are in `result/share/terminal-website`. The npm dependencies come from `package-lock.json`, so there is no separate dependency hash to maintain.

To serve it, import the module into your server configuration:

```nix
{
  imports = [ /path/to/terminal_website/nix/module.nix ];

  services.terminal-website = {
    enable = true;
    domain = "ada.example.org";
  };
}
```

The module builds the site for that domain, serves it with Caddy (automatic HTTPS, compression, basic security headers, long caching for `/_astro/`, the custom 404 page) and opens ports 80 and 443. Point the domain's DNS at the server before running `nixos-rebuild switch`, so Caddy can obtain a certificate. Other Caddy sites can still be configured through `services.caddy.virtualHosts`.

To deploy a package built elsewhere, set `services.terminal-website.package`.

**Check:** `npm run test:caddy` (after `npm run build`) evaluates the module and runs its Caddy configuration against `dist/` locally, checking routes, the 404 status and caching.

## Updating and rolling back

Every deploy is a complete rebuild. To publish changes, push (GitHub Pages) or rebuild and copy `dist/` again.

To roll back on GitHub Pages, revert the commit and push. On NixOS, `nixos-rebuild switch --rollback` returns to the previous system, including the previous site.

## Before the first release

- `npm run check:release` passes and prints the right address.
- `npm run build` passes.
- No sample content is left: search `src/content` for `example: true` and placeholder text.
- `src/config/site.json` has your name and links.
- Open the site on a phone, and try it with the keyboard alone.
