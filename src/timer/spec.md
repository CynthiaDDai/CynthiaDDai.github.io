# Exam timer

A countdown to project while proctoring, at `/timer`; the terminal command `timer` opens it. Everything for it lives in this folder. Outside it there are only `src/pages/timer.astro` (which gives it its address), the `timer` command in `src/lib/terminal/registry.ts` (with `standalonePaths`, which lets `src/scripts/site.ts` open a page outside the content tree), and the tests `tests/unit/timer.test.ts` and `tests/browser/timer.spec.ts`.

| File | Holds |
| --- | --- |
| `Timer.astro` | The page: top bar, clock, announcement board, settings menu |
| `time.ts` | Parsing what is typed, and what the clock shows; no DOM, unit-tested |
| `markdown.ts` | Markdown with `$…$` / `$$…$$` math, cut into editable blocks |
| `timer.ts` | The page in the browser: clock, editor, settings, wake lock, storage |
| `timer.css` | Its styles |

## Rules

- **Simple.** The page shows the clock, the announcements, and one quiet row of controls: length, start/pause/resume, reset, settings. Nothing else goes on the page itself.
- **The clock starts in the middle.** Clock and announcements are centred together, so with no announcements the clock is in the middle of the screen; as announcements grow it is pushed up, but stops short of the top bar.
- **No network after loading.** Markdown, KaTeX and its fonts are bundled. State is in `localStorage` (`timer-clock`, `timer-announcements`, `timer-settings`), so a reload carries on. No offline service worker: the school PC has wifi to load the page.
- **The time left is computed from the end time**, never counted, so sleep, background tabs and reloads cannot make it drift.
- **Exam time is in whole minutes, the countdown's steps in whole seconds.** The length and time adjustments are minutes (`80`, `1:20`, `+5`); the step and thresholds in settings are seconds (`60`, `1`, `90`), or a whole-number share of the exam such as `10%`. Each field shows its unit. A colon goes one unit up: `1:20` minutes is 1 hour 20, `1:30` seconds is 90 seconds. Nothing else is accepted: no decimals, no written-out units. A field with anything else turns red and the previous value stays in use.
- **The step is at least 1 second**, since the clock shows nothing finer; `0` is refused. The half step is half the step rounded down, at least 1 second: 60 → 30, 45 → 22, 1 → 1. A threshold of `0` turns its phase off; `0:00` at the end is red regardless.
- **Only a length is entered**, never an end time. The countdown begins at start, so a late start needs no arithmetic. The end time is not shown; it is on the exam's front page.
- **Steps.** The clock counts every step (60 seconds), in half steps once the time left is at most 10% of the exam, and every second, in the theme's red, for the last minute. It always shows `m:ss` or `h:mm:ss`; the step only changes how often it changes. Values round up, so it never shows less time than is left, never ticks up, and shows `0:00` only at the end, where it stays in red. No sound, no blinking.
- **Settings are in a dropdown**, closed by default: adjust time (`+5`, `-2`), the step, the half-step threshold, the red-seconds threshold, and the theme. Adjusting time is only there, never on the page, so it cannot be clicked by accident.
- **Reset during an exam takes a second click** within three seconds.
- **Theme.** The site's theme (`site-theme` in `localStorage`) applies automatically, including a change made on the site in another tab; the settings menu can change it too.
- **Screen stays awake** through the Screen Wake Lock API, asked again whenever the tab becomes visible. If the browser refuses, the top bar says `screen may sleep`.
- **Announcements are what you see is what you get.** One Markdown text with LaTeX, edited in place: click a block (paragraph, list, heading, display math) to edit its source at the size it is shown; the other blocks stay rendered. Escape, Ctrl+Enter or a click elsewhere closes it; a click on the empty board starts a new block. The text is never reordered or restructured.
- **Text size fills the board.** It is drawn as large as fits and shrinks as more is written. Below about 3.5% of the window height, the proctor sees `text getting small` while editing; nothing is refused.
- **Hidden from the site**, but listed in `help`: not in navigation, search or the sitemap, and marked `noindex`.
