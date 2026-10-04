# Terminal-Inspired Personal Website — Master Specification

**Status:** implementation-ready master spec  
**Primary implementation target:** Codex / coding agent  
**Preferred stack:** Astro + TypeScript + Markdown/MDX  
**Core idea:** a content-first personal website whose interaction language is inspired by a Linux shell, without turning the website into a terminal emulator or sacrificing readability, accessibility, browser conventions, or compatibility with tools such as Vimium.

## Version 3 amendments — 2026-10-03

These supersede the earlier interaction details:

- Keep the wider home terminal centered within the available viewport. History scrolls internally and follows new output; the prompt remains visible. Keep all home results until cleared or the page is left.
- Content pages show only their current command result, without command echoes or arrow-key history. Escape dismisses that result.
- Search uses `s`; `/` remains available for Vimium.
- Friend links open in separate tabs, preserving the current site. Whether a new tab takes the foreground is controlled by the browser.
- Import native fastfetch JSONC for appearance at build time. Remove the custom fastfetch CLI flags and presets. Show USER, SYSTEM, ACTIVITY, and NETWORK blocks using website data.
- Keep profile, contact, social, and friend settings in `src/config/site.json`; fastfetch appearance in the supplied root `config.jsonc`; prompt themes in their existing local JSON files.

## Version 2 amendments — 2026-10-03

These owner-requested changes supersede the version 1 interactions described below:

- `:` focuses the command input on every page; `/` opens full-site search, including article bodies and static-page prose. Neither shortcut applies inside editable fields or with browser modifier keys.
- Tab stays in the focused command input, completes commands and paths, and recomputes suggestions after edits. Directories get a trailing slash and expose their children. Shift+Tab or Escape leaves the input.
- Content pages have one persistent command bar directly above their content. The prompt contains the only linked breadcrumb. The modal command drawer, header command icon, and repeated path eyebrow are removed.
- Long paths, commands, and suggestions wrap without clipping.
- Fastfetch supports configurable module order, labels, templates, separators, logos, named presets, command options, and JSON output.
- `ssh` lists configured friend links; `ssh <alias>` opens the configured website. Google is the requested proof of concept.
- The `history` command is removed. Arrow-key recall of recent commands remains available.

The implementation and README describe the current version. The remainder records the original design.

---

## 0. Product thesis

Build a **terminal-inspired, keyboard-native personal website**.

The website should feel like it belongs to someone who actually lives in a terminal, but it must still behave like a well-designed modern website.

The key distinction is:

> **Use terminal metaphors for navigation and interaction. Do not use terminal constraints for reading and content presentation.**

The home page may behave like a shell. Blog posts, notes, project pages, and other long-form content must render as real, highly readable web pages with good typography, math, code highlighting, figures, links, headings, and navigation.

The site must support both:

- normal browser/mouse/touch navigation; and
- a first-class shell-like command interface.

Neither mode is secondary. They are two interfaces over the same route/content model.

---

# 1. Design principles

## 1.1 Terminal-inspired, not terminal-emulated

Do **not** build a browser TTY, shell emulator, pseudo-filesystem runtime, or xterm clone.

We need a small command grammar and a visual prompt system, not Bash.

The terminal layer should understand commands such as:

```text
ls
pwd
cd ..
cd ~/projects
open foo
back
home
search transformers
fastfetch
theme
theme neko
help
clear
```

It does **not** need:

```text
pipes |
redirects >
&& / ||
shell expansion
subprocesses
environment variables
real filesystem access
arbitrary program execution
```

The command system should map cleanly to website actions.

---

## 1.2 Content-first

The site is not a novelty demo.

After the first 10 seconds, visitors should be able to forget that the interaction layer is unusual and simply read the content comfortably.

Long-form pages must never be rendered as terminal output such as:

```text
$ cat post.md
...
```

or as an 80-column terminal dump.

Instead:

- normal responsive article layout;
- good prose typography;
- code blocks rendered with syntax highlighting;
- KaTeX-rendered math;
- figures and captions;
- links and footnotes;
- table of contents when useful;
- selectable/copyable text;
- normal browser scrolling.

Terminal styling belongs primarily to **site chrome, navigation, prompt, command UI, and micro-interactions**.

---

## 1.3 Keyboard-native, not keyboard-hijacking

The site should be excellent with a keyboard, but it must not compete with Vimium, Surfingkeys, browser shortcuts, assistive technology, or OS shortcuts.

Default behavior MUST NOT globally intercept printable keys such as:

```text
j k h l f g / o t
```

Do not implement a site-wide Vimium clone by default.

Instead:

- use real semantic `<a>`, `<button>`, `<input>`, `<nav>`, and `<main>` elements;
- keep normal Tab / Shift+Tab / Enter / Space behavior;
- process shell commands only while the site command input is explicitly focused;
- allow Vimium to discover and operate the site's actual links itself;
- keep any Vim-style navigation mode opt-in and disabled by default.

The site should be **Vimium-friendly**, not a replacement for Vimium.

---

## 1.4 One router, multiple interfaces

Mouse navigation, keyboard navigation, breadcrumbs, command execution, hidden navigation, and normal links must all resolve to the same route model.

Example:

```text
/browser URL:        /blog/transformers
/virtual path:       ~/blog/transformers
/breadcrumb:         ~ / blog / transformers
/shell navigation:   cd ..
/normal navigation:  click “Blog”
```

All of these should resolve through one canonical routing/navigation layer.

Do not create parallel navigation logic for terminal mode and normal mode.

## 1.5 Conventions over compatibility

This is a personal website, not a general-purpose filesystem browser. When an unusual input would require extra string processing, define a rule and reject the input at build time with a readable message.

Content contract (added 2026-10-04):

- A valid `.md`/`.mdx` file is a page; a folder containing a published page is a section; everything else is ignored.
- Folder and document names match `^[a-z0-9]+(-[a-z0-9]+)*$`. Display names, in any language, go in frontmatter `title`.
- Names starting with `_` or `.` are never routed.
- Empty folders are not pages. `index.md` is optional and only supplies the directory's title, description, order, draft state and introduction; it does not change themes.
- Personal wording in templates comes from `src/config/site.json`.

---

# 2. Information architecture

Initial route model:

```text
/
/about
/blog
/blog/[slug]
/projects
/projects/[slug]
/notes
/notes/[slug]
/uses
/contact
```

Optional later routes:

```text
/updates
/reading
/archive
/tags/[tag]
```

The route tree should also be exposed as a small virtual filesystem/navigation tree.

Example:

```text
~
├── about
├── blog/
├── projects/
├── notes/
├── uses
└── contact
```

This virtual filesystem is a navigation abstraction only. It is not a real browser filesystem.

---

# 3. Home / intro experience

## 3.1 Critical aesthetic requirement

**Do not lazily place a tiny terminal prompt in the top-left corner.**

That looks like an unstyled terminal mockup and wastes the visual opportunity of the concept.

The home page should instead treat the prompt as the main visual object.

### Preferred default composition

Use a sparse full-viewport landing stage with the terminal prompt positioned near the optical center of the screen.

Recommended desktop layout:

```text
                [ large amount of breathing room ]

                  ┌─ user :: host
                  └─ ~/ > █

                [ large amount of breathing room ]
```

Guidelines:

- roughly centered horizontally;
- optical vertical center around `40–46vh`, not mathematically dead-center if that feels too low;
- prompt should use a **large, intentional display size**, approximately `clamp(1.35rem, 2.1vw, 2rem)` depending on the supplied theme/font;
- terminal content width should be comfortable, approximately `min(92vw, 900–1050px)`;
- no tiny 12px faux-terminal text;
- no fake macOS traffic-light window decoration unless a future theme explicitly calls for it;
- the page should feel sparse, not unfinished;
- the prompt itself must be immediately visible.

The initial screen can be almost blank, but it should not be visually ambiguous as a broken page.

A subtle hint may appear after a short idle delay, for example:

```text
type `help` or use the navigation
```

The hint should disappear as soon as the command surface is focused or used.

### Focus policy

Do **not** globally capture typing just because the home page looks like a terminal.

Default recommendation:

- the terminal input is a real focusable input;
- clicking the prompt focuses it;
- keyboard users can reach it immediately with Tab;
- avoid mandatory autofocus by default to minimize conflict with Vimium and browser-level keyboard workflows.

If autofocus is later desired, make it a configurable site preference rather than an architectural assumption.

---

## 3.2 Home terminal growth behavior

Before the first command, the prompt is a centered hero object.

After command output begins, the terminal can smoothly transition into a larger centered transcript region.

Conceptually:

```text
INITIAL

            prompt


AFTER `ls`

       prompt
       output
       prompt
```

Do not snap the terminal to the extreme top-left.

A good target is a centered column with a maximum readable width and comfortable top/bottom padding.

Respect `prefers-reduced-motion` and disable non-essential movement when requested.

---

# 4. Content-page experience

Markdown/blog/project/note pages are **normal web pages**, not terminal dumps.

Recommended structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ ~/blog/transformers    Home Blog Projects Notes      >_      │
└──────────────────────────────────────────────────────────────┘

                 Article title
                 metadata / date / tags

          readable prose column, figures, math,
          syntax-highlighted code, footnotes, etc.
```

## 4.1 Top navigation

Content pages should have a real top navigation bar. Site-wide section links are not repeated there: the right-edge index stays in the same place on every page, as on home, and marks the current section (decided 2026-10-04).

It should contain some combination of:

- current path / breadcrumb;
- a link home (the wordmark);
- command-surface trigger such as `>_`;
- appearance/theme control if needed.

The path may use terminal language while remaining a real breadcrumb:

```text
~ / blog / transformers
```

Each ancestor should be a real link.

## 4.2 Shell command access from content pages

Users must still be able to issue commands such as:

```text
cd ..
cd ~/projects
back
home
search attention
```

However, command output must not be inserted into the article body.

Instead, activating the command surface should expand a small command drawer/palette from the header or open a lightweight overlay.

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ ~/blog/transformers                                         │
├──────────────────────────────────────────────────────────────┤
│ > cd .._                                                    │
└──────────────────────────────────────────────────────────────┘
```

If a command has informational output (`ls`, `help`, `fastfetch`), show it inside this command surface, not inside the prose document.

---

# 5. Normal navigation / fallback navigation

The shell interface must never be the only way to navigate.

## 5.1 Desktop edge navigation

On the home page, use a subtle right-edge navigation affordance.

Desired behavior:

- mostly hidden while idle;
- a thin rail/handle remains discoverable;
- mouse hover expands it;
- keyboard focus expands it via `:focus-within`;
- navigation items are actual links;
- it must not depend on hover alone.

Possible visual language:

```text
                                   │
                                   │
                                   ├─ ~/
                                   │  about
                                   │  blog
                                   │  projects
                                   │  notes
                                   │  contact
```

Avoid a conventional giant hamburger menu if the terminal-inspired rail can remain clear and accessible.

## 5.2 Mobile / touch

Hover does not exist on touch devices.

On coarse pointers / small screens:

- expose a persistent but visually quiet navigation trigger;
- open the same nav model in a sheet/drawer;
- keep the terminal input usable with a mobile keyboard;
- do not rely on hover-specific cues.

---

# 6. Command model

Implement a small command registry.

Suggested interface:

```ts
interface CommandContext {
  cwd: string;
  previousPath: string | null;
  navigate: (path: string) => void;
  theme: ThemeController;
  search: SearchController;
  site: SiteIndex;
}

interface CommandResult {
  kind: 'text' | 'list' | 'navigation' | 'error' | 'rich';
  payload?: unknown;
}

interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  execute(args: string[], ctx: CommandContext): CommandResult | Promise<CommandResult>;
}
```

## 6.1 Required commands

### `help`

Display supported commands and concise usage.

### `pwd`

Display virtual current path.

### `ls [path]`

List navigable children of the current or specified route.

Results should be clickable/focusable where appropriate.

### `cd <path>`

Navigate to another route/path.

Required behavior:

```text
cd ..
cd ../..
cd ~
cd ~/projects
cd -
```

`cd -` should return to the previous route.

### `open <target>`

Open a named page/resource from the current context.

### `back`

Use browser/router history semantics where safe.

### `home`

Navigate to `/`.

### `search <query>`

Search titles, descriptions, tags, and optionally indexed body text.

### `fastfetch`

Display a compact site/status summary sourced from real site data.

Potential fields:

```text
site       personal website
status     active
latest     newest update/post/project
writing    current/latest post
building   latest project
updated    most recent content date
```

Do not hardcode “latest” values in the component.

### `theme`

List themes and current theme.

### `theme <name>`

Switch themes at runtime.

### `clear`

Clear shell transcript/palette output only.

### `history`

Show site-command history.

---

## 6.2 Optional commands

Potential later additions:

```text
whoami
man <topic>
about
projects
blog
notes
resume
```

Aliases are acceptable, but keep the command set coherent.

Do not add commands purely for terminal cosplay if they provide no useful website behavior.

---

# 7. Keyboard interaction and Vimium coexistence

This is a hard requirement.

## 7.1 Default mode

In normal page state:

- no document-level interception of printable keys;
- standard browser scrolling remains intact;
- `Tab` navigates interactive elements;
- `Shift+Tab` moves backward;
- `Enter` activates links/buttons;
- `Escape` closes only site-owned overlays/drawers when relevant;
- browser/extension shortcuts retain control.

## 7.2 Command-input mode

When the command input has focus, the site may support terminal-like editing behavior:

```text
ArrowUp / ArrowDown   command history
Tab                   autocomplete
Ctrl+L                clear command transcript (optional)
Ctrl+C                cancel current command/input (optional)
Escape                leave/close command surface
```

Only apply these while the site-owned input is focused.

## 7.3 Optional Vim-style site mode

A future `keyboard on` mode MAY provide:

```text
j / k   scroll
G       bottom
gg      top
```

But:

- it must be disabled by default;
- users must explicitly enable it;
- the UI should visibly indicate that the mode is active;
- it must be easy to disable (`keyboard off` or settings UI);
- do not implement custom `f` link-hints by default;
- do not attempt to replace Vimium.

This feature is post-MVP.

---

# 8. Content system

Use Astro Content Collections or equivalent typed content infrastructure.

Recommended layout:

```text
src/content/
├── blog/
│   ├── post-one.md
│   └── post-two.mdx
├── projects/
│   ├── project-one.md
│   └── project-two.mdx
├── notes/
│   └── ...
└── updates/
    └── ...
```

## 8.1 Frontmatter

Recommended common fields:

```yaml
title: "..."
description: "..."
date: 2026-10-03
updated: 2026-10-03
tags:
  - ...
draft: false
```

Project-specific fields may include:

```yaml
status: active
repo: "..."
demo: "..."
featured: true
```

## 8.2 Markdown rendering requirements

Support:

- standard Markdown;
- MDX when explicitly needed;
- headings with stable anchors;
- footnotes;
- code fences;
- tables;
- blockquotes;
- images / figures;
- optional generated table of contents.

Do not require MDX for ordinary posts.

---

# 9. LaTeX / math / code rendering

Math is required.

Preferred compile-time pipeline:

```text
Markdown
  -> remark-math
  -> rehype-katex
  -> rendered HTML
```

Support inline and display math:

```md
Inline: $E = mc^2$

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$
```

Use Shiki or equivalent for code syntax highlighting.

The code highlighting theme should be configurable independently from the terminal prompt theme.

---

# 10. Theme architecture

Theme handling is a first-class subsystem.

The current Oh My Posh theme will be provided separately and should become the first real theme fixture.

**Do not hardcode colors or prompt geometry from the screenshot. The supplied theme file is the source of truth.**

## 10.1 Theme layers

Separate at least these concepts:

```text
SiteTheme
├── terminal / prompt theme
├── chrome theme
├── prose theme
└── syntax theme
```

A terminal palette may inform the wider site design, but article readability must remain independently tunable.

Example type:

```ts
interface SiteTheme {
  id: string;
  name: string;

  terminal: TerminalTheme;
  chrome: ChromeTheme;
  prose: ProseTheme;

  syntaxTheme: string;
}
```

---

# 11. Oh My Posh theme parser

The ideal implementation is a parser/adapter rather than manually rewriting each theme.

Target API:

```ts
function parseOhMyPoshTheme(input: unknown): ParsedOhMyPoshTheme;

function adaptOhMyPoshTheme(
  parsed: ParsedOhMyPoshTheme,
  options?: ThemeAdapterOptions,
): SiteTheme;
```

The parser should read a local Oh My Posh theme JSON file at build time or application initialization.

## 11.1 Parser goal

The goal is **visual and structural fidelity for the supplied theme**, not 100% compatibility with all possible Oh My Posh configurations.

Support the subset actually useful for web rendering, then degrade gracefully.

## 11.2 Target Oh My Posh concepts

Support/normalize, where present:

```text
palette
blocks
segments
block type
alignment
newline
segment type
segment style
foreground
background
template
leading/trailing symbols
diamond/powerline/plain-like segment geometry
relevant properties
```

Represent the result as a site-owned prompt AST rather than coupling React/Astro components directly to raw Oh My Posh JSON.

Example normalized structure:

```ts
interface PromptTheme {
  lines: PromptLine[];
  palette: Record<string, string>;
}

interface PromptLine {
  alignment: 'left' | 'right';
  segments: PromptSegment[];
}

interface PromptSegment {
  type: string;
  style: 'plain' | 'powerline' | 'diamond' | 'text';
  foreground?: string;
  background?: string;
  template?: string;
  leadingSymbol?: string;
  trailingSymbol?: string;
  properties?: Record<string, unknown>;
}
```

Actual interfaces may differ, but keep raw parsing, normalization, and rendering separate.

## 11.3 Do not implement a full Go-template engine

Oh My Posh templates may contain dynamic template logic. Do **not** execute arbitrary template code in the browser.

Implement a small, explicit renderer/placeholder registry for supported web concepts.

Example site prompt context:

```ts
interface PromptContext {
  user: string;
  host: string;
  cwd: string;
  previousPath?: string;
  routeKind?: string;
  status?: 'ok' | 'error';
}
```

Recognized prompt values can map to site state.

Examples:

```text
username      -> configured site/guest label
hostname      -> configured site host label
path / pwd    -> current route path
status        -> last command status
```

Unsupported Oh My Posh segments should:

1. never crash the site;
2. be omitted or fall back to a safe literal representation;
3. emit a development-only warning;
4. allow per-theme adapter overrides when exact visual fidelity is needed.

## 11.4 Theme overrides

Provide a small override mechanism for concepts that cannot be inferred safely from Oh My Posh.

Example:

```ts
const overrides = {
  user: 'guest',
  host: 'example.dev',
  unsupportedSegments: 'omit',
};
```

This should be the exception, not the main way themes are created.

---

# 12. Theme tokens and CSS

Convert a parsed theme into CSS custom properties.

Example:

```css
:root {
  --site-bg: ...;
  --site-fg: ...;
  --site-muted: ...;

  --terminal-bg: ...;
  --terminal-fg: ...;
  --terminal-accent-1: ...;
  --terminal-accent-2: ...;
  --terminal-success: ...;
  --terminal-error: ...;

  --prose-fg: ...;
  --prose-muted: ...;
  --prose-link: ...;
  --prose-code-bg: ...;

  --chrome-bg: ...;
  --chrome-border: ...;
}
```

Do not make prose simply inherit every terminal color.

The prose layer should be derived/tuned to preserve long-form readability and contrast.

Runtime theme switching should operate through a single theme controller/store.

Persist the selected theme in `localStorage`.

---

# 13. Prompt renderer

The prompt renderer should consume two inputs only:

```text
PromptTheme + PromptContext
```

It should not know about command parsing, content collections, or route loading.

Conceptual pipeline:

```text
Oh My Posh JSON
      ↓
parser
      ↓
normalized prompt theme AST
      ↓
PromptRenderer + current PromptContext
      ↓
web prompt
```

The renderer should support multi-line prompts, because the supplied current theme uses a multi-line visual structure.

Font/glyph rendering must be tested on the chosen web font and on fallback fonts.

Do not assume every visitor has Nerd Fonts installed locally.

If special glyphs are essential, use a licensed web-safe strategy or provide graceful fallbacks. Do not ship font files casually as part of this spec.

---

# 14. Fastfetch data model

`fastfetch` should be generated from site data, not hardcoded output.

Define something like:

```ts
interface FastfetchData {
  siteName: string;
  hostLabel: string;
  role?: string;
  latestPost?: ContentRef;
  latestProject?: ContentRef;
  latestUpdate?: ContentRef;
  lastUpdated?: string;
}
```

The exact visual structure should be theme-aware.

Potential output:

```text
site       example.dev
role       researcher / developer
latest     New post: ...
building   Project: ...
updated    2026-10-03
```

Do not make ASCII art mandatory. It should be theme-configurable.

---

# 15. Search / omnibox behavior

The command surface can double as a command palette and search surface.

Examples:

```text
> cd projects
> search transformer
> theme neko
```

When input is not a recognized command, it MAY offer search suggestions instead of immediately erroring.

Example:

```text
transformer

Search
  Blog      Transformer Notes
  Projects  Attention Visualizer
```

Keep the implementation static-first.

For MVP, indexing title / description / tags is sufficient.

Full body search can be added later without changing the command UI contract.

---

# 16. Component architecture

Suggested structure:

```text
src/
├── components/
│   ├── shell/
│   │   ├── TerminalHero.*
│   │   ├── Prompt.*
│   │   ├── PromptInput.*
│   │   ├── Transcript.*
│   │   ├── CommandDrawer.*
│   │   └── CommandOutput.*
│   ├── nav/
│   │   ├── TopNav.*
│   │   ├── EdgeNav.*
│   │   └── Breadcrumbs.*
│   └── content/
│       ├── ArticleLayout.*
│       ├── ProjectLayout.*
│       ├── TOC.*
│       └── Prose.*
│
├── lib/
│   ├── terminal/
│   │   ├── parser.ts
│   │   ├── registry.ts
│   │   ├── history.ts
│   │   ├── autocomplete.ts
│   │   └── commands/
│   │       ├── ls.ts
│   │       ├── cd.ts
│   │       ├── pwd.ts
│   │       ├── search.ts
│   │       ├── fastfetch.ts
│   │       ├── theme.ts
│   │       └── ...
│   ├── navigation/
│   │   ├── filesystem.ts
│   │   ├── resolver.ts
│   │   └── site-index.ts
│   ├── theme/
│   │   ├── types.ts
│   │   ├── omp-parser.ts
│   │   ├── omp-adapter.ts
│   │   ├── prompt-renderer.ts
│   │   └── registry.ts
│   └── search/
│       └── index.ts
│
├── content/
│   ├── blog/
│   ├── projects/
│   ├── notes/
│   └── updates/
│
├── themes/
│   ├── default.omp.json
│   └── ...
│
├── layouts/
├── pages/
└── styles/
    ├── tokens.css
    ├── chrome.css
    ├── prose.css
    └── terminal.css
```

Use the framework's conventions as needed; the important requirement is separation of concerns.

---

# 17. Framework / rendering strategy

Preferred implementation:

```text
Astro
+ TypeScript
+ Astro Content Collections
+ Markdown / MDX
+ remark-math
+ rehype-katex
+ Shiki
```

Keep JavaScript islands limited to interactive parts:

- terminal hero;
- command drawer;
- theme switcher;
- edge navigation if needed.

Articles and ordinary content should render to useful static HTML.

The site should remain highly usable even before interactive JavaScript finishes loading.

---

# 18. State management

Avoid a heavyweight global state framework unless clearly needed.

Minimum state:

```text
current route             router/source of truth
previous route            navigation controller
command history           sessionStorage preferred
selected theme            localStorage
command drawer open       local UI state
optional keyboard mode    localStorage only if user enables it
```

Do not persist ephemeral command output unnecessarily.

---

# 19. Typography and visual system

## 19.1 Terminal/chrome typography

Use the font and styling implied by the supplied theme where legally and technically practical.

Terminal chrome may be monospaced.

Prompt text can be oversized on the home page.

## 19.2 Prose typography

Article prose does **not** have to use the terminal font.

Choose a highly readable prose stack and constrain line length.

Target:

```text
body measure: ~65–78ch
comfortable line-height
clear heading hierarchy
generous vertical rhythm
```

Code remains monospaced.

Math should visually integrate with prose.

## 19.3 Visual restraint

Avoid generic “hacker website” clichés unless they come directly from the user's actual theme:

- do not default to neon green-on-black;
- do not add scanlines/glitch effects by default;
- do not fake CRT bloom;
- do not fill every screen with ASCII borders;
- do not use terminal metaphors when normal typography is better.

The aesthetic target is:

> **a polished personal site designed by someone who likes terminals**, not **a terminal skin pretending to be a website**.

---

# 20. Accessibility

Required:

- semantic landmarks (`nav`, `main`, `article`, etc.);
- visible focus states;
- skip-to-content link;
- no hover-only functionality;
- sufficient contrast;
- command output announced appropriately (for example, a restrained `aria-live` region where useful);
- no focus trap unless inside a true modal/dialog;
- Escape closes overlays without breaking browser behavior;
- reduced-motion support;
- headings in logical order;
- links remain distinguishable beyond color alone where practical;
- all terminal command suggestions that are clickable must also be keyboard focusable.

Do not intentionally reproduce inaccessible terminal behavior.

---

# 21. Performance and SEO

The site should be static-first and content-first.

Targets:

- minimal JavaScript on article pages;
- no client-side terminal framework required to read content;
- static HTML for Markdown pages;
- correct page titles and descriptions;
- canonical URLs;
- Open Graph metadata;
- sitemap;
- RSS/Atom for blog if straightforward;
- responsive images where relevant.

Terminal interaction must not obscure crawlable content or replace real links with JavaScript-only pseudo-links.

---

# 22. Security boundaries

The shell is a UI metaphor only.

Never:

- execute arbitrary shell commands;
- use `eval` or dynamic code execution for commands;
- execute arbitrary Oh My Posh template code;
- insert unsanitized command output into HTML;
- expose local/server filesystem paths;
- treat user command input as code.

Commands should resolve through a fixed registry of pure application actions.

---

# 23. Testing requirements

## 23.1 Unit tests

Cover:

- command tokenizer/parser;
- `cd` path resolution;
- `cd ..`, `cd ~`, `cd -`;
- `ls` route listing;
- autocomplete;
- theme parser normalization;
- unsupported theme segment fallback;
- theme token generation;
- search index behavior.

## 23.2 Browser tests

Use Playwright or equivalent for flows such as:

```text
home -> focus prompt -> ls -> click blog
home -> cd ~/projects
article -> open command drawer -> cd ..
article -> normal nav works
edge nav works with mouse
edge nav works by keyboard focus
mobile nav works without hover
theme change persists
```

## 23.3 Compatibility sanity checks

Manually confirm:

- normal browser keyboard use;
- page works with a Vimium-like extension enabled;
- no global `j/k/f` interception in default mode;
- screen reader/focus order is reasonable;
- no content is inaccessible when JavaScript is slow or unavailable.

---

# 24. Implementation phases

## Phase 1 — content-first foundation

Build:

- Astro project;
- content collections;
- article/project/note layouts;
- Markdown/MDX;
- KaTeX;
- syntax highlighting;
- routes;
- top navigation;
- prose styling.

**Exit condition:** the site is already a good normal personal website before terminal interaction exists.

## Phase 2 — route/filesystem abstraction

Build:

- route tree;
- virtual path resolver;
- breadcrumbs;
- `pwd`, `ls`, `cd`, `open`, `back`, `home` behavior.

**Exit condition:** all navigation surfaces can use one canonical resolver.

## Phase 3 — terminal hero + command surface

Build:

- centered home prompt;
- terminal transcript;
- command parser/registry;
- history;
- autocomplete;
- content-page command drawer.

**Exit condition:** terminal navigation feels useful rather than decorative.

## Phase 4 — Oh My Posh theme parser

After the actual user theme is supplied:

- add it as a fixture;
- implement parser + normalization;
- implement prompt renderer;
- map palette to CSS tokens;
- verify visual fidelity;
- add dev warnings for unsupported features;
- keep adapter overrides minimal.

**Exit condition:** changing the local theme file should require little/no terminal component rewrite.

## Phase 5 — secondary navigation and responsive polish

Build:

- right-edge desktop nav;
- keyboard/focus behavior;
- mobile nav trigger;
- motion polish;
- responsive prompt scale;
- reduced-motion behavior.

## Phase 6 — fastfetch and search

Build:

- updates/latest-content model;
- `fastfetch`;
- title/tag search;
- richer search later if warranted.

## Phase 7 — optional power-user mode

Only after the rest is stable:

- explicit `keyboard on/off` mode;
- optional j/k, gg/G scrolling;
- visible active-mode indicator.

Do not block the initial release on this.

---

# 25. Definition of done / acceptance criteria

The project is considered successful when all of the following are true:

- [ ] Home page presents a **large, intentional, centrally composed terminal prompt**, not a tiny prompt in the top-left.
- [ ] The initial experience is sparse but obviously intentional and usable.
- [ ] `ls`, `pwd`, `cd`, `cd ..`, `cd -`, `open`, `back`, `home`, `help`, `fastfetch`, `search`, `theme`, and `clear` work.
- [ ] Shell commands resolve through the same route model as normal links.
- [ ] Blog/project/note pages render as real readable web pages, never as `cat`/`bat` output.
- [ ] Markdown pages support high-quality typography, syntax-highlighted code, and KaTeX math.
- [ ] Content pages have real top navigation, the same right-edge index as home, and a shell command affordance.
- [ ] Desktop has an accessible right-edge navigation affordance.
- [ ] Mobile does not depend on hover.
- [ ] Default behavior does not globally capture Vimium-like keys.
- [ ] Normal semantic links/buttons work with browser keyboard navigation and third-party keyboard tools.
- [ ] The supplied Oh My Posh theme is parsed through a reusable theme parser/adapter.
- [ ] Prompt rendering is decoupled from command parsing.
- [ ] Theme colors become CSS tokens instead of scattered hardcoded values.
- [ ] Theme switching works without changing command/content code.
- [ ] Long-form prose remains readable independently of terminal aesthetics.
- [ ] Core article content is statically rendered and SEO-friendly.
- [ ] No arbitrary shell/template code execution exists.
- [ ] Accessibility basics and reduced-motion support are present.

---

# 26. Explicit non-goals

Do not spend MVP time on:

- full terminal emulation;
- Bash/Zsh compatibility;
- pipes/redirection/process management;
- a real browser filesystem;
- recreating Vimium link hints;
- globally hijacking keyboard input;
- full Oh My Posh Go-template compatibility;
- reproducing every Oh My Posh segment plugin;
- forcing all site content into monospace;
- rendering articles as terminal output;
- flashy CRT/glitch effects;
- complex server infrastructure unless a future feature genuinely needs it.

---

# 27. Architectural summary

```text
                         SITE
                          │
            ┌─────────────┴─────────────┐
            │                           │
       interaction                  content
            │                           │
   ┌────────┼────────┐          Markdown / MDX
   │        │        │                 │
terminal  top nav  edge nav      Astro content
   │        │        │                 │
   └────────┼────────┘          ┌──────┼──────┐
            │                   │      │      │
        route resolver        prose   math   code
            │
      virtual site tree
            │
       real URL router


THEME PIPELINE

Oh My Posh JSON
      │
      ▼
 OMP parser
      │
      ▼
 normalized theme AST
      │
      ├──────────────► PromptRenderer
      │                    │
      │              PromptContext
      │              (cwd/user/host/status)
      │
      └──────────────► CSS theme tokens
                           │
                 ┌─────────┼─────────┐
                 │         │         │
              chrome    terminal    prose
```

The governing principle for implementation decisions is:

> **Looks like it grew out of a real terminal workflow; behaves like an excellent website.**

When aesthetics and usability conflict, preserve the terminal identity in the interaction language and chrome, but preserve normal web usability in content, navigation semantics, accessibility, and browser behavior.
