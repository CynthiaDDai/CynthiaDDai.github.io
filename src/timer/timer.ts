// The timer page in the browser: the countdown, the announcement board, settings, and keeping the screen awake.
// Everything is kept in localStorage, so a reload in the middle of an exam carries on where it was.
import { ThemeController } from '../lib/theme/registry';
import { defaultSettings, display, formatClock, parseAdjustment, parseDuration, validSetting, type TimerSettings } from './time';
import { blocks } from './markdown';

type Status = 'idle' | 'running' | 'paused' | 'done';
interface Clock { status: Status; input: string; totalMs: number; leftMs: number; endAt: number; }

const keys = { clock: 'timer-clock', text: 'timer-announcements', settings: 'timer-settings' };
const load = <T>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value === null ? fallback : { ...fallback, ...JSON.parse(value) }; } catch { return fallback; }
};
const loadText = () => { try { return localStorage.getItem(keys.text) ?? ''; } catch { return ''; } };
const save = (key: string, value: unknown) => {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* Storage is optional. */ }
};

const root = document.querySelector<HTMLElement>('[data-timer]')!;
const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
const clockView = $<HTMLElement>('[data-clock]');
const board = $<HTMLElement>('[data-board]');
const note = $<HTMLElement>('[data-note]');
const durationInput = $<HTMLInputElement>('[data-duration]');
const lengthField = $<HTMLElement>('[data-length]');
const startButton = $<HTMLButtonElement>('[data-start]');
const resetButton = $<HTMLButtonElement>('[data-reset]');
const settingsMenu = $<HTMLDetailsElement>('[data-settings]');

// ── The countdown ──

const notes: Record<string, string> = { paused: '', sleep: '', small: '' }; // shown in the top bar, for the proctor

const initialMs = parseDuration(durationInput.value)!;
let clock: Clock = load(keys.clock, { status: 'idle', input: durationInput.value, totalMs: initialMs, leftMs: initialMs, endAt: 0 });
let settings: TimerSettings = load(keys.settings, defaultSettings);
for (const key of Object.keys(defaultSettings) as (keyof TimerSettings)[]) {
  if (typeof settings[key] !== 'string' || !validSetting(key, settings[key])) settings[key] = defaultSettings[key]; // saved by an older version
}
durationInput.value = clock.input;

const leftNow = () => clock.status === 'running' ? clock.endAt - Date.now() : clock.leftMs;
function setClock(next: Partial<Clock>) {
  clock = { ...clock, ...next };
  save(keys.clock, clock);
  paint();
}

function start() {
  if (clock.status === 'idle') {
    const total = parseDuration(durationInput.value);
    if (!total) { durationInput.setAttribute('aria-invalid', 'true'); durationInput.focus(); return; }
    setClock({ status: 'running', input: durationInput.value, totalMs: total, leftMs: total, endAt: Date.now() + total });
  } else if (clock.status === 'paused') setClock({ status: 'running', endAt: Date.now() + clock.leftMs });
  else if (clock.status === 'running') setClock({ status: 'paused', leftMs: Math.max(0, clock.endAt - Date.now()) });
  keepAwake();
}

// Reset during an exam needs a second click, so a stray click cannot wipe the clock.
let resetArmed = 0;
function reset() {
  if ((clock.status === 'running' || clock.status === 'paused') && !resetArmed) {
    resetButton.textContent = 'reset? click again';
    resetArmed = window.setTimeout(disarmReset, 3000);
    return;
  }
  disarmReset();
  const total = parseDuration(durationInput.value) ?? clock.totalMs;
  setClock({ status: 'idle', totalMs: total, leftMs: total, endAt: 0 });
}
function disarmReset() { clearTimeout(resetArmed); resetArmed = 0; resetButton.textContent = 'reset'; }

function adjust(deltaMs: number) {
  if (clock.status === 'idle') return;
  const totalMs = Math.max(0, clock.totalMs + deltaMs);
  if (clock.status === 'running') setClock({ totalMs, endAt: clock.endAt + deltaMs });
  else if (clock.status === 'paused') setClock({ totalMs, leftMs: Math.max(0, clock.leftMs + deltaMs) });
  else if (deltaMs > 0) setClock({ status: 'running', totalMs, leftMs: deltaMs, endAt: Date.now() + deltaMs }); // time added after the end
}

let shown = '';
function paint() {
  if (clock.status === 'running' && clock.endAt <= Date.now()) { setClock({ status: 'done', leftMs: 0 }); return; }
  const idleTotal = parseDuration(durationInput.value);
  const total = clock.status === 'idle' ? idleTotal ?? clock.totalMs : clock.totalMs;
  const left = clock.status === 'idle' ? total : leftNow();
  const { shownMs, phase } = display(left, total, settings);
  const text = formatClock(shownMs);
  if (text !== shown) { clockView.textContent = text; shown = text; }
  root.dataset.status = clock.status;
  root.dataset.phase = clock.status === 'idle' ? 'normal' : clock.status === 'done' ? 'final' : phase;
  lengthField.hidden = clock.status !== 'idle';
  startButton.hidden = clock.status === 'done';
  startButton.textContent = { idle: 'start', running: 'pause', paused: 'resume', done: '' }[clock.status];
  notes.paused = clock.status === 'paused' ? 'paused' : '';
  paintNotes();
}

durationInput.addEventListener('input', () => {
  if (parseDuration(durationInput.value)) durationInput.removeAttribute('aria-invalid'); else durationInput.setAttribute('aria-invalid', 'true');
  paint();
});
durationInput.addEventListener('keydown', event => { if (event.key === 'Enter') start(); });
startButton.addEventListener('click', start);
resetButton.addEventListener('click', reset);
// The display only changes on a step, but checking four times a second costs nothing and never drifts:
// the time left is always worked out from the end time, not counted.
setInterval(paint, 250);

// ── Notes in the top bar ──

function paintNotes() {
  const text = Object.values(notes).filter(Boolean).join(' · ');
  if (note.textContent !== text) note.textContent = text;
}

// ── Keeping the screen awake ──

let lock: WakeLockSentinel | null = null;
async function keepAwake() {
  if (lock || document.visibilityState !== 'visible') return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
    notes.sleep = '';
  } catch { notes.sleep = 'screen may sleep'; }
  paintNotes();
}
// The browser lets go of the lock when the tab is hidden; ask again when it is back.
document.addEventListener('visibilitychange', keepAwake);
keepAwake();

// ── Settings ──

const settingInputs = [...root.querySelectorAll<HTMLInputElement>('[data-setting]')];
for (const input of settingInputs) {
  const key = input.dataset.setting as keyof TimerSettings;
  if (settings[key] !== defaultSettings[key]) input.value = settings[key];
  input.addEventListener('input', () => {
    const value = input.value.trim() || defaultSettings[key];
    const ok = validSetting(key, value);
    if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
    if (!ok) return;
    settings = { ...settings, [key]: value };
    save(keys.settings, settings);
    paint();
  });
}
const adjustInput = $<HTMLInputElement>('[data-adjust-input]');
$<HTMLFormElement>('[data-adjust]').addEventListener('submit', event => {
  event.preventDefault();
  const delta = parseAdjustment(adjustInput.value);
  if (delta === null || clock.status === 'idle') { adjustInput.setAttribute('aria-invalid', 'true'); return; }
  adjust(delta);
  adjustInput.value = '';
  adjustInput.removeAttribute('aria-invalid');
});
adjustInput.addEventListener('input', () => adjustInput.removeAttribute('aria-invalid'));

const theme = new ThemeController();
const themeSelect = $<HTMLSelectElement>('[data-theme-select]');
themeSelect.value = theme.current.id;
themeSelect.addEventListener('change', () => theme.set(themeSelect.value));
// A theme chosen on the site in another tab applies here too.
window.addEventListener('storage', event => {
  if (event.key === 'site-theme' && event.newValue && theme.set(event.newValue)) themeSelect.value = event.newValue;
});

// The menu closes on a click outside it, or Escape.
document.addEventListener('click', event => { if (!settingsMenu.contains(event.target as Node)) settingsMenu.open = false; });
settingsMenu.addEventListener('keydown', event => {
  if (event.key === 'Escape') { settingsMenu.open = false; settingsMenu.querySelector('summary')!.focus(); }
});

// ── The announcement board ──
// Markdown and LaTeX, edited where they are shown: the block being edited shows its source, the rest stay rendered.

let text = loadText();
let editing: { start: number; end: number; prefix: string } | null = null;
let field: HTMLTextAreaElement | null = null;

function renderBoard() {
  const parts = blocks(text);
  const nodes: HTMLElement[] = [];
  let placed = false;
  for (const part of parts) {
    if (editing && !placed && part.start >= editing.start) { nodes.push(editor()); placed = true; }
    if (editing && part.start === editing.start && part.end === editing.end) continue;
    const node = document.createElement('div');
    node.className = 'timer-block';
    node.innerHTML = part.html;
    nodes.push(node);
  }
  if (editing && !placed) nodes.push(editor());
  if (!parts.length && !editing) {
    const hint = document.createElement('p');
    hint.className = 'timer-hint';
    hint.textContent = 'Click here to write announcements. Markdown and $LaTeX$ work.';
    nodes.push(hint);
  }
  board.replaceChildren(...nodes);
  root.dataset.announcements = parts.length || editing ? 'full' : 'empty';
  if (field) { sizeField(); field.focus(); }
  fit();
}

function editor(): HTMLTextAreaElement {
  const value = text.slice(editing!.start, editing!.end);
  if (!field) {
    field = document.createElement('textarea');
    field.className = 'timer-editor';
    field.setAttribute('aria-label', 'Edit announcement');
    field.spellcheck = false;
    field.value = value;
    field.addEventListener('input', () => { sizeField(); fit(); });
    field.addEventListener('blur', commit);
    field.addEventListener('keydown', event => {
      if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) { event.preventDefault(); field!.blur(); }
    });
    queueMicrotask(() => field?.setSelectionRange(field.value.length, field.value.length));
  }
  return field;
}
function sizeField() {
  if (!field) return;
  field.style.height = '0';
  field.style.height = `${field.scrollHeight}px`;
}

function edit(start: number, end: number, prefix = '') {
  if (editing) return;
  editing = { start, end, prefix };
  renderBoard();
}
function commit() {
  if (!editing || !field) return;
  const value = field.value.replace(/\s+$/, '');
  const { start, end, prefix } = editing;
  let next = text.slice(0, start) + (value ? prefix + value : '') + text.slice(end);
  if (!value) next = next.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, ''); // a block emptied out takes its blank lines with it
  editing = null;
  field = null;
  text = next;
  save(keys.text, text);
  notes.small = '';
  renderBoard();
  paintNotes();
}

// mousedown rather than click: it comes before the open editor loses focus, so one click both closes the block
// being edited and opens the one clicked. Closing the editor renumbers the text, so the clicked block is found again
// by its place: counted from the start if it was before the editor, from the end if after. Neither count can change.
board.addEventListener('mousedown', event => {
  const target = event.target as HTMLElement;
  if (event.button !== 0 || target.closest('a') || target.closest('.timer-editor')) return;
  if (settingsMenu.open) return; // this click only closes the menu
  event.preventDefault();
  const block = target.closest<HTMLElement>('.timer-block');
  const visible = [...board.querySelectorAll('.timer-block')];
  const after = !!(block && field && field.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING);
  const wasEditing = !!editing;
  commit();
  const parts = blocks(text);
  const part = !block ? undefined : after ? parts.at(visible.indexOf(block) - visible.length) : parts[visible.indexOf(block)];
  if (part) edit(part.start, part.end);
  else if (!block && !wasEditing) { // a click on the empty board starts a new block; while editing, it only closes the editor
    const body = text.replace(/\s+$/, '');
    edit(body.length, text.length, body ? '\n\n' : '');
  }
});

// The text is drawn as large as the board allows, and shrinks as more is written. Below a size that the back
// of a room can comfortably read, the proctor gets a note while editing; nothing is cut off or refused.
const comfortable = 0.035; // of the window's height
let fitting = 0;
function fit() {
  cancelAnimationFrame(fitting);
  fitting = requestAnimationFrame(() => {
    const height = window.innerHeight;
    let low = height * 0.012, high = height * 0.075;
    for (let i = 0; i < 12; i++) {
      const size = (low + high) / 2;
      board.style.fontSize = `${size}px`;
      sizeField();
      if (board.scrollHeight <= board.clientHeight + 1) low = size; else high = size;
    }
    board.style.fontSize = `${low}px`;
    sizeField();
    notes.small = editing && low < height * comfortable ? 'text getting small' : '';
    paintNotes();
  });
}
window.addEventListener('resize', fit);
// The board and clock trade space when announcements appear, so fit again once that settles.
new ResizeObserver(fit).observe(board);

renderBoard();
paint();
