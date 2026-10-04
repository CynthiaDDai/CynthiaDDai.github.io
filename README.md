# Terminal personal website

A static Astro site with a shell-inspired home, readable Markdown/MDX articles, and a shared route model for links, breadcrumbs, search, and commands. Version 3 keeps a wide, centered home terminal with scrolling output, uses `:` for commands and `s` for search, opens friend links in new tabs, and imports the supplied native fastfetch configuration for its website snapshot. Content pages show only the current command result. Theme folders in `src/themes` are discovered automatically; `storm`, copied from the supplied Tokyo theme, is the default. Mobile opens directly into a touch-first index with navigation, tools and recent pages. `storm_day` keeps the same design and changes only the palette.

**Your content folder is your website. A file becomes a page. A folder becomes a section. Add an `index.md` when you want to customize the section; otherwise the site generates the section view for you.**

## Quick start (any OS)

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev      # http://127.0.0.1:4321
npm test
npm run build    # type check, static build into dist/, internal link check
```

Upload `dist/` to any static host (see "Deploy elsewhere" below). Nix is optional; the next section is for NixOS users. Continuous integration (`.github/workflows/ci.yml`) runs the unit, build, browser and development suites with Playwright's own Chromium.

## Develop on NixOS

```sh
nix-shell
npm ci
npm run dev
```

Open the local address printed by Astro, normally `http://127.0.0.1:4321`. The shell supplies Node.js 22, Chromium, and Caddy; Playwright uses that Chromium rather than downloading a binary incompatible with NixOS.

```sh
nix-shell shell.nix --run 'npm test'
nix-shell shell.nix --run 'npm run test:browser'
nix-shell shell.nix --run 'npm run test:dev'
nix-shell shell.nix --run 'npm run test:build'
nix-shell shell.nix --run 'npm run build'
nix-shell shell.nix --run 'npm run test:caddy'
```

The browser suite builds the fixture site, then starts and stops a production preview on port 4322, leaving the normal development server on 4321 available. It uses an explicitly configured Chromium, an available NixOS system Chromium, or Playwright's installed Chromium on other systems. A separate `npm run test:dev` suite runs against a real Astro development server on port 4335. It covers saved themes with absent optional companions, live theme companion changes in a temporary Vite fixture, and content additions, edits and removals in an isolated Astro fixture on port 4336. The build regression test uses a temporary copy to verify automatic root/section/nested routes, generated and explicit indexes, images, source preservation, draft rules, ignored `_`/dot names, asset-only folders, rejected file names, deployment updates and `.env`/RSS/sitemap/canonical origins. Run the production and development browser suites sequentially because they share the Playwright output directory. Production builds force a content refresh so Markdown plugin changes cannot reuse stale rendered HTML. Production files go into `dist/`. No Node process is needed in production.

## Make it yours

- Edit `src/config/site.json` for the owner, compact `bio`, prompt user/host, description, email, GitHub URL, `socials`, and `friends`. `activityLimit` controls how many recently updated pages fastfetch shows. Empty contact fields are omitted. Google is a proof-of-concept friend entry.
- The same file holds every piece of personal wording in the page templates, so changing it is a string edit: `wordmark` (`name` plus the styled `suffix`, e.g. `cynthia` + `’s space`), the home `caption`, the `homeFooter` words, the content-page `pageFooter`, the 404 `notFound` title and description, the HTML `lang`, and the `dateLocale` used for article dates.
- Edit the root `config.jsonc` for fastfetch's appearance. It uses the native fastfetch file you supplied, including comments and trailing commas. Edit or add a folder under `src/themes` for prompts and site colors (see Themes below). `src/config/themes.json` controls the default and cycling order.
- All settings are local files; rebuild with `npm run build` after editing them. No settings dashboard or hosted configuration service is involved. `src/config.ts` only connects these files to the implementation.
- Set `PUBLIC_SITE_URL` in `.env` or `.env.production` to your public origin for local production builds. An injected process environment variable takes priority; malformed origins fail the build. Run `npm run check:release` before releasing to reject placeholder or local origins. The NixOS module supplies it from its domain automatically. `https://example.com` is a development placeholder.
- Write pages and create folders anywhere under `src/content/`, including root files such as `about.md`. No collection registration, navigation array or route table needs editing. Frontmatter is optional; its supplied fields are validated by `src/content.config.ts`.
- `feed` lists the directories whose dated documents appear in `/rss.xml` (default `["/blog"]`); add `"/research"` or any other folder. `site.json` is checked on every build and in development: unknown fields, malformed URLs or emails, duplicate friend aliases and an invalid `dateLocale` stop with a message naming the field.
- Tests never build your own content. `tests/fixtures/site/` holds a separate sample site (`content/` plus `site.json`) with example and `placeholder-*` pages that exercise every feature. The browser, development and build suites point `SITE_CONTENT_DIR`, `SITE_PROFILE` and `SITE_OUT_DIR` at it (output goes to `.fixture-dist/`), so editing `src/content` or `src/config/site.json` cannot break them. Your real content is checked by `npm run build` itself: names, `site.json`, types and internal links. Content files read the profile with `import site from '@site/profile'`.
- The sample attention article is marked `example: true`, visibly labelled, and excluded from RSS and fastfetch’s latest-content fields. Replace it with your writing, then remove the example flag.
- Set `draft: true` to exclude a document in both production and development. Drafts are never built, so their URLs return 404; this is the way to keep anything off the site. Keep truly private writing outside the repository anyway, since the source is not encrypted. The older `hidden` flag has been removed and now stops the build with a pointer to `draft`. A draft `index.md` excludes its whole directory subtree; the root `src/content/index.md` cannot be a draft, since that would exclude the whole site. A folder becomes a page only when it contains at least one published document (its own `index.md` counts); empty folders, image folders and draft-only folders never become pages.
- For project entries, optionally add `status`, `repo`, `demo`, and `featured`.
- For papers and other works, optionally add `authors`, `venue` and `links` (label → URL, e.g. `arXiv`, `PDF`, `HTML`; site files use absolute paths such as `/research/paper.pdf`). They appear on the work's own page and in its parent's listing, where each link is directly clickable.

```yaml
---
title: "A new thought"
description: "What this page is about."
date: 2026-10-03
tags: [mathematics]
draft: false
---
```

Every document uses the article layout (date, tags, contents, project links and a link back to its parent), wherever it lives; folders use the listing layout.

Link to other pages with absolute site paths: `[my note](/notes/first-note)`. Relative links such as `./first-note.md` are not rewritten. `npm run build` ends with `npm run check:links`, which fails if any internal `href` or `src` in `dist/` points at a missing file.

Ordinary Markdown supports stable heading anchors, tables, footnotes, images, fenced code, and inline/display math. MDX is available when a component is useful. Shiki emits semantic CSS variables, so code colors follow the active website theme without a reload.

## Content folders and pages

```text
src/content/
├── about.md                         → /about
├── research.md                      → /research
├── blog/
│   ├── index.md                     → /blog (custom landing page)
│   └── hello-world.md               → /blog/hello-world
└── notes/
    └── mathematics/
        └── topology.md             → /notes/mathematics/topology
```

### Naming rules

Folder and document names (without `.md`/`.mdx`) use lowercase ASCII letters and digits, joined by single hyphens: `notes/machine-learning/first-post.md`. Spaces, capitals, underscores (other than a leading `_`), dots, `#`, `?`, non-ASCII letters and similar characters stop the build with a list of every file to rename. Display names are separate: put any title, in any language, in the frontmatter `title`. Names starting with `_` or `.` are never routed or checked, so `_assets/`, `_drafts/`, `_scratch.md` and editor folders such as `.obsidian/` can live inside `src/content`. Other files, such as images, are not routed and their names are not checked.

`/notes` and `/notes/mathematics` get generated landing pages that list their direct children, using the existing section renderer. No `index.md` is written into your source folder. To customize a directory's title, description, order or introductory prose, add its own `index.md`:

```md
---
title: Writing
description: Ideas with room to breathe.
order: 20
---

I write about software, design and mathematics.
```

Children appear below that introduction by default. Set `show_children: false` to hide this listing; the child routes remain available through navigation, commands and search. `index.md` represents its directory and never creates a separate `/index` URL or search result. An optional `src/content/index.md` adds a root introduction and listing below the existing home shell.

To split a listing into sections, give the directory's `index.md` a `groups` map from `status` value to heading. Children are listed under each heading in the map's order (empty sections are omitted), and every child must then carry one of those statuses, or the build stops and names the file. Keep the works flat in one folder: changing `status: Preprint` to `status: Publication` moves a work between sections without changing its URL.

```yaml
# research/index.md
---
title: Research
groups:
  Publication: Publications
  Preprint: Preprints
---

# research/heights.md
---
title: Heights on stacks
status: Preprint
authors: Cynthia Dai, A. Coauthor
venue: arXiv 2503.01234
links:
  arXiv: https://arxiv.org/abs/2503.01234
  PDF: /research/heights.pdf
---
Optional notes, abstract or errata.
```

A directory's `index.md` is also the only place its listing metadata comes from. Its `title` is the name shown in navigation and listings (the only way to give a folder a non-ASCII display name), and its `description` is the text shown next to it in `ls`, listings and search. Without one, the directory shows its derived name and `Explore ~/path.`. Indexes do not change themes or colors; the visitor's chosen theme applies site-wide.

All frontmatter is optional, including `title`, `description`, `order`, `date`, `updated`, `tags`, `draft`, `example`, `show_children` and `groups`. A file containing just `Hello world.` is a valid page. `my-cool-page.md` gets the title `My Cool Page`; a directory named `machine-learning` gets `Machine Learning`. The source path determines the URL; a frontmatter `slug` does not override it. See the naming rules above.

Sibling order uses an explicit numeric `order` first (lower values first), followed by directories, then documents. When all visible sibling documents have dates, documents sort newest first; otherwise the fallback is alphabetical by path. The sample section indexes supply their original navigation order through frontmatter. Both `.md` and `.mdx` are supported, but two files or a file and directory cannot occupy the same public path. System paths such as `/404`, `/rss.xml`, `/_astro` and sitemap XML paths are reserved; conflicts fail the build with a readable error.

For images, place a file alongside your Markdown (or in a folder such as `_assets/`) and use `![Descriptive alt text](./diagram.png)`, or put an asset in `public/` and refer to it as `![Descriptive alt text](/diagram.png)`. Existing Markdown/MDX rendering handles the assets. About and Uses now live in root Markdown files. The supplied Contact uses MDX to show links from `site.json`; it can be replaced by an ordinary `contact.md` if you prefer to write the links directly.

PDFs and other downloads are not embedded, since browser PDF viewers ignore the site theme and fail on most phones. Instead, a link that stands alone on the first line of a paragraph and points at a file in `public/` becomes a file card. The link text is the card's title, and any further lines of that paragraph become its optional description (inline Markdown and math work there). The card shows the file's type, size and name, with a download button. A link inside a sentence stays an ordinary link.

```md
[Why Linear Algebra](/assets/slides/whylinalg.pdf)
Motivating linear maps with a formula for the Fibonacci numbers.
```

Every entry in a directory listing, and every file card, is drawn as a prompt by the current theme: its Oh My Posh `transient_prompt`, repainted when the theme changes. The prompt's path is shortened to the item's name, `…/name` in bold (a directory's ends in `/`); a file card is named after its title in lowercase words, such as `…/algebraic-stacks`. Transient prompts that leave out the path are followed by the name. Below the prompt come the title, only when it says more than the name (other words or another script, such as `MATH 146` for `math-146-winter-2023`), the description, and a line of details and links: the date, authors and venue, tags, or a file's type and size with a `pull` button that downloads it.

Items with a state offer it to the theme as Oh My Posh git fields, and the theme decides how to show it: a file is `.Segments.Git.Behind` (there is something to pull); a file whose link title is `"wip"`, such as `[Category Theory](/notes/category.pdf "wip")`, also has `.Segments.Git.Working.Changed`, as does every work outside the first group of a grouped listing (so list groups from finished to in progress). Anything else with a state is clean. Ordinary pages have no state, so `.Segments.Contains "Git"` is false. The supplied Storm theme shows clean as `✓`, working changes as `~` and behind as `⇣`; any other link title on a file card stops the build.

`npm run build` scans the current tree, generates static routes and rebuilds all navigation and search data. Deploy the new `dist/` to publish additions, edits and removals. The deployed site does not watch your filesystem or run a content server. Development uses Astro's content watcher and recomputes the tree when pages are requested; refresh after editing content. Builds never generate or modify files under `src/content/`.

The implementation has one recursive Astro content collection and one normalized tree in `src/lib/content/tree.ts`, loaded by `src/lib/navigation/site-index.ts`. Routes, desktop/mobile navigation, directory pages, `ls`, `cd`, `open`, completion, search and fastfetch consume that tree or its flat projection. Generated directory search entries contain their own metadata, without copying child bodies. Explicit indexes search their own prose. The RSS endpoint publishes dated, public, non-example documents under the `feed` directories in `site.json`; documents without dates remain fully usable pages.

## Commands and keyboard behavior

`help`, `pwd`, `ls [path]`, `cd <path>`, `open <path or title>`, `back`, `home`, `search <query>`, `fastfetch`, `ssh [friend]`, `theme [name]`, and `clear`.

Paths support `~`, `~/projects`, `/projects`, `..`, `../..`, and `cd -`. Commands act on the content tree built with the site. Both `cd about` and `open about` open a root Markdown document; `cd blog` opens a directory. `ls`, `ls blog`, `ls ../notes` and `ls ~/projects` list direct visible children. Directory names retain their trailing `/` in shell output. `ssh` opens a configured friend’s website in a separate tab with `noopener` and `noreferrer`; the current site remains open. Listed friend links behave the same way. Browsers control whether a new tab is brought to the foreground.

Press `:` outside text fields to focus the command line on any page. Press `s` to search titles, descriptions, tags, paths and content prose. `/` is left available for Vimium. Search updates while typing; Enter opens the first result and arrow keys move through results. One Escape closes search, including when its query is nonempty or a result has focus, and returns focus to the opener. Shortcuts ignore text fields, editable content, IME composition, and modified browser shortcuts.

While the command input is focused, Tab always completes or displays suggestions. A unique directory gains a trailing `/`, and its children become the next suggestions. Ambiguous matches extend their common prefix; ArrowDown/ArrowUp can focus suggestion buttons, and Enter accepts them. Shift+Tab or Escape leaves the input. Long commands, paths, and suggestions wrap visibly. Ctrl+L clears output; Ctrl+C clears the input when no text is selected. Home supports command recall with arrow keys when suggestions are absent. Content pages neither record nor recall command history; Escape also dismisses their current result. There is no `history` command.

The desktop index rail on the right edge is the same on every page, and opens on hover, keyboard focus, or explicit activation; on content pages it marks the current section. Until a visitor first opens it, the handle twitches slightly a few seconds after each page load (never with reduced motion); after that, it stays still (remembered in `localStorage`). Mobile and touch devices use the shared index instead. Content pages have only the wordmark and theme switch at the top, and a persistent command bar immediately above the content. Its linked prompt path is the only breadcrumb. Output stays in that bar, outside article prose. Content and navigation remain useful without JavaScript.

Home keeps all transcript results until cleared or the page is left. Its transcript scrolls internally to the newest output while the prompt remains visible inside a centered terminal. Home command recall lives in `sessionStorage`; selected themes live in `localStorage`. Both storage mechanisms are optional. Content pages replace their previous result each time a command runs.

## Mobile interaction

At widths up to 700px, or with a coarse primary pointer, home opens the index directly. Its header toggles the expanded index; the minimized home still offers tools. Content pages have an `index +` disclosure, linked current path and 44px touch controls for search, commands and themes. All ordinary navigation, nested parents, article contents and index links work without JavaScript.

Command opens a sheet from the top. Tap `help` or `fastfetch` to execute it immediately without focusing a text field. Navigation, search, theme selection and friend links have their own controls, so they are omitted from this shortcut list. The list comes from the command registry's `touchShortcut` field. Results replace the previous result and can be cleared with a button; mobile commands do not record terminal history. Fastfetch uses compact website information without its desktop tree ornamentation.

`Type a command` explicitly expands the optional input. It supports the regular command grammar, a touch completion button, Tab completion and the run button; running a custom command releases input focus on mobile. Expanding it does not automatically focus the input. Search intentionally focuses its query field. The theme sheet shows every available theme and saves a tapped choice. Closing a sheet or search returns focus to its opener; Escape and tapping the backdrop also close it. Rotating within the touch layout preserves an open sheet; switching between desktop and mobile dismisses it.

## Customize fastfetch

Type `fastfetch`; there are no command flags or presets. It presents four blocks:

| Block | Information |
| --- | --- |
| USER | Owner, short bio, and a link to About |
| SYSTEM | Total visible routes and document counts for every discovered root directory |
| ACTIVITY | Recently updated published content, with dates and links; illustrative examples are excluded |
| NETWORK | Configured email and social links, Contact, and RSS |

The root `config.jsonc` supplies `display.separator`, section `keyColor` values, and tree geometry from module `key` strings. Section headings are mapped to the four website blocks in file order. Named terminal colors use the active website palette. Nerd Font glyphs get standard Unicode fallbacks. Hardware modules, native format expressions, shell commands, and local machine paths are not evaluated or sent to the browser; the appearance is normalized at build time.

Optional native `logo: { "type": "data", "source": "( o.o )" }` gives a text logo. A browser image can use `logo.source: "/avatar.png"` after placing the image in `public/avatar.png`. The supplied Kitty logo's Nix-store path is skipped because it belongs to a local terminal. The supplied original configuration can otherwise remain as it is.

For contact and friend links, edit these arrays in `src/config/site.json`:

```json
"socials": [{ "name": "Mastodon", "url": "https://social.example/@you" }],
"friends": [{ "alias": "friend", "name": "A friend", "url": "https://friend.example" }]
```

```text
fastfetch
ssh
ssh google
```

## Themes

The theme pipeline is directory discovery on the build server → JSON parser → prompt AST → adapter → CSS tokens and prompt renderer. The browser receives theme JSON through a Vite virtual module; it never reads the filesystem. No theme-specific TypeScript registration is needed.

To add a theme, create `src/themes/my-theme/`, put exactly one native `.omp.json` file inside it, and rebuild. Only immediate directories are registered; loose files and deeper directories are not themes. The folder name becomes the theme ID and must use lowercase letters, numbers, hyphens or underscores. The native filename can differ from the ID. Empty folders and folders with multiple OMP files fail with a readable error. `theme` lists all discovered themes, and `theme my-theme` switches prompt, navigation, article, command output and syntax colors. Tab completion and the theme button use the same catalog. `theme 1_shell` selects your second supplied file, imported unchanged. The root OMP files are retained as original references; the active copies are under `src/themes`.

Site colors use the source palette when it defines semantic colors. Themes without a palette, such as `1_shell`, use segment and inline markup colors; website text colors are adjusted for readable contrast. An OMP prompt often does not define its terminal emulator's background or an editor's syntax palette. Missing backgrounds use neutral dark/light defaults, and syntax colors are derived from the prompt palette. This is an adaptation, not an exact recreation of a terminal emulator or editor theme.

Optional sibling web overrides supply information that a prompt theme does not contain. For `src/themes/my-theme/native.omp.json`, create `src/themes/my-theme/native.web.json`:

```json
{
  "name": "My terminal",
  "mode": "dark",
  "chrome": { "background": "#17191f", "foreground": "#e6e6e6", "accent": "#00c7fc" },
  "prose": { "link": "#00c7fc", "codeBackground": "#101216" },
  "syntax": { "comment": "#b0b5bf", "keyword": "#ee79d1", "string": "#a9ffb4" }
}
```

Overrides are optional. `chrome` also accepts `muted` and `border`; `prose` accepts `foreground` and `muted`; `syntax` accepts `constant`, `function` and `parameter`. Colors may be hex values or `p:palette-name` references. `segmentOverrides` maps a segment type or alias to replacement text, or `null` to omit it. The default and cycling order live in `src/config/themes.json`; new theme folders need no entry there. A removed default falls back to the first available theme.

Each theme folder can also contain an optional `theme_mobile.json`:

```text
src/themes/
  storm/
    storm.omp.json       # required native prompt
    storm.web.json       # optional website colors/name
    theme_mobile.json   # optional mobile companion
  storm_day/
    storm_day.omp.json
    storm_day.web.json
    theme_mobile.json
  my-theme/
    native.omp.json
```

The supplied mobile companions belong only to Storm and Storm Day. The existing `1_shell`, `if_tea` and Paper have no mobile file. Their site colors carry over and custom input uses a generic path-and-arrow fallback. Theme authors own the design of their mobile companions; the site does not derive a responsive variant of every native OMP prompt.

A mobile companion accepts `prompt` (a native OMP prompt object), optional `mode`, `chrome`, `prose`, `syntax`, and `segmentOverrides`. Unknown top-level fields and malformed objects are rejected; the configured `fallback.invalidCompanion` policy determines whether to use a fallback with diagnostics or stop the build. Colors and segment overrides follow the same safe adapter rules as desktop web overrides. Missing color fields inherit the desktop theme; the native palette is also available in the mobile prompt. Color overrides apply across the mobile index, panels and prose. Arbitrary HTML, CSS, scripts and commands are not accepted. The mobile UI remains shared; this file controls prompt rendering and colors, not navigation content or arbitrary page templates.

```json
{
  "prompt": {
    "blocks": [
      { "type": "prompt", "segments": [
        { "type": "path", "style": "plain", "foreground": "p:blue", "template": "{{ .Path }}" }
      ] },
      { "type": "prompt", "newline": true, "segments": [
        { "type": "text", "style": "plain", "foreground": "p:green", "template": "❯ " }
      ] }
    ]
  }
}
```

Storm Day preserves Storm's OMP blocks, templates, symbols and mobile structure, changing only the palette and the light color mode. Both are manual choices; the site does not override a saved theme based on the time of day.

Theme fallback behavior lives in `src/config/themes.json`, alongside `default` and `order`:

```json
{
  "default": "storm",
  "order": ["storm", "storm_day", "paper"],
  "fallback": {
    "web": {},
    "mobile": "compact",
    "invalidCompanion": "fallback"
  }
}
```

- `fallback.web` supplies web adapter options when a theme has no valid `.web.json`. The default `{}` derives colors from the required OMP file and uses neutral defaults for missing background information. You can set shared `mode`, `chrome`, `prose`, `syntax`, or `segmentOverrides` here using the same format as a web companion.
- `fallback.mobile` defaults to `"compact"`, showing the current path and an arrow while retaining the selected theme's site colors. Use `"desktop"` to keep the original OMP prompt, or supply an object with the same fields as `theme_mobile.json` to define a shared custom mobile fallback.
- `fallback.invalidCompanion` defaults to `"fallback"`: malformed JSON or invalid optional companion fields produce development diagnostics and use the configured fallback. Set it to `"error"` for strict editing/build validation. Absent optional files always use the fallback.

Valid local companions take priority over global fallback settings. Fallback options are used for missing or rejected companion files, rather than merged into valid local companions. Invalid fallback settings are configuration errors. The required OMP file remains required and its errors always stop loading; a fallback never turns an invalid native theme into another theme.

In development, the plugin watches the theme directory and settings through Vite's server watcher. It does not register optional paths as module imports or request absent files from the browser. Adding, changing or removing a companion (or changing fallback settings) refreshes both server and browser theme data. You do not need to clear the saved theme selection after adding or removing optional files.

The browser supports `text`, `session`, `path`, `status` and `time` segments; hex/palette colors, ANSI names and xterm 256-color numbers, left/right alignment, block newlines and conditional foreground/background colors. Native `<foreground,background>text</>` markup supports either empty component, palette keys and `foreground`, `background`, `parentForeground` and `parentBackground` references. A transparent foreground draws a cutout in its background, as in OMP. Diamond caps take the segment background as their foreground and sit outside the segment body; powerline symbols connect adjacent visible segment backgrounds. Basic bold, italic, underline, overline, strikethrough and dim decorations are supported.

Safe template values are `.UserName`, `.HostName`, `.Path`, `.PWD`, `.Folder` and `.Code` (0 for success, 1 for error). Conditions support `.Error`, `.Root` and `.SSHSession` (the latter two are false in a browser), plus numeric `eq`, `ne`, `gt`, `ge`, `lt` and `le` comparisons of `.Code`. The `templates` array supports native `join` and `first_match` behavior, and Go whitespace-trim markers are honored. Time supports `{{ .CurrentDate | date .Format }}` and common Go date layout tokens for year, month, weekday, day, hours, minutes, seconds and AM/PM; timezone/fractional-second layouts are not implemented. Time refreshes when the prompt renders. Themes without a usable path receive a website breadcrumb automatically.

Git, OS/shell environment, hardware, cloud, runtime and execution-time modules are omitted. Arbitrary Go templates, dynamic palettes/styles, gradients/shades, OMP path-shortening styles, terminal title/transient prompts and pixel-exact terminal geometry are not implemented. Development diagnostics identify omitted segments and unknown expressions. Prompt Unicode is preserved, including JSON escapes and supplementary-plane Nerd Font icons. Private-use glyphs use a bundled Symbols Nerd Font Mono v3.4.0 WOFF2, with its upstream MIT license in `public/fonts`; visitors need no installed Nerd Font or external font service. The complete symbol set is included so additional themes do not require new glyph mappings. Ordinary text uses the existing system fonts. Raw input and context are escaped, and theme files never execute commands or HTML.

These rules follow the official Oh My Posh [segment](https://ohmyposh.dev/docs/configuration/segment), [color](https://ohmyposh.dev/docs/configuration/colors), and [template](https://ohmyposh.dev/docs/configuration/templates) documentation. `if_tea.omp.json` is another unchanged native theme fixture; select it with `theme if_tea`.

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. In the repository's Settings → Pages, set Source to "GitHub Actions". The repository must be named `<user>.github.io` or use a custom domain, because the site is served from a domain root; the workflow stops with an error on a project sub-path. `PUBLIC_SITE_URL` is taken from the Pages configuration automatically.

## Deploy elsewhere

`dist/` is a plain static site meant for the root of a domain (`https://you.example/`, a GitHub Pages user site or a custom domain). Sub-path hosting such as `username.github.io/repository/` is not supported. Pages are built as `notes/first-note.html` (and `notes.html` beside a `notes/` folder), so the server should answer `/notes/first-note` with `notes/first-note.html` without redirecting, and serve `404.html` with status 404. GitHub Pages, Netlify and Cloudflare Pages do this by default; Caddy needs `try_files {path} {path}.html` (the NixOS module below includes it) and Nginx `try_files $uri $uri.html =404`. Hosts that only serve `folder/index.html` would redirect every page to a trailing-slash URL that differs from the canonical one; `npm run build` checks every internal link against this layout. Set `PUBLIC_SITE_URL` when building.

## Deploy on a NixOS server with Caddy

Build a standalone static package:

```sh
nix-build default.nix --argstr siteUrl https://your-domain.example
```

The files are in `result/share/terminal-website`. `default.nix` uses `importNpmLock` and the checked-in npm lockfile; no manually maintained npm dependency hash is needed. The server’s selected nixpkgs provides the build tools. Pin nixpkgs in your server configuration for reproducible tool versions.

Import the module from your server configuration:

```nix
{
  imports = [ /path/to/terminal_website/nix/module.nix ];

  services.terminal-website = {
    enable = true;
    domain = "your-domain.example";
  };
}
```

The module builds the site for that domain, serves the Nix-store output with Caddy, enables compression and basic response headers, caches fingerprinted assets, serves the custom 404 page, and opens ports 80/443. Caddy manages certificates and HTTPS redirects. Point the domain at your server before rebuilding. Existing Caddy configuration can coexist through `services.caddy.virtualHosts`.

An already built package can be supplied with `services.terminal-website.package`. This repo does not alter your machine or deploy to a server automatically.

## Verification scope

Unit tests cover tokenization, path resolution, completion, full-text search, native fastfetch JSONC/theme import, website statistics and activity, friend links, automatic directory-based theme discovery, optional mobile companions, Storm Day geometry, environment-file precedence, nested parent paths, palette-less themes, optional web overrides, status color templates, Unicode preservation, color markup, diamond/powerline colors, template arrays, and HTML escaping. Browser tests cover repeated help output and scrollback, a centered wide terminal, single-result content commands, friend links in separate tabs, keyboard shortcuts, single-Escape search dismissal, actual webfont glyph rendering, completion, touch-first mobile index, command/theme sheets, opt-in typing, touch completion, mobile search/focus, narrow/landscape/tablet layouts, persisted themes, live syntax color changes, no-JavaScript reading, and accessibility in all five themes.

Real screen-reader and Vimium-extension testing still needs a manual pass before launch. No public domain, server credentials, or personal contact information is supplied in this checkout.

The Caddy integration test evaluates the NixOS module and runs its actual Caddy directives against `dist/`, checking routes without redirects, custom 404 status, and asset caching. Run it after `npm run build`.

Dependency audit: `npm audit` reports no known vulnerabilities as of 2026-10-04; recheck it when upgrading dependencies. Astro/Vite also emits an upstream MDX `use astro:head-inject` bundling warning; static MDX output is covered by the browser and Caddy checks.

## License

Code is MIT-licensed. Personal content (`src/content/` and the profile in `src/config/site.json`) is all rights reserved; replace it with your own when you fork. See `LICENSE`.
