// Pure timer arithmetic: parsing what is typed, and what the clock shows. No DOM here, so it is unit-tested.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// Exam time is in minutes: the length and adjustments. The countdown's steps are in seconds.
export interface TimerSettings {
  step: string;       // the normal step, in seconds
  halfBelow: string;  // below this, count in half steps: seconds, or a share of the exam such as 10%
  finalBelow: string; // below this, count every second and turn red, in seconds
}
export const defaultSettings: TimerSettings = { step: '60', halfBelow: '10%', finalBelow: '60' };

type Unit = 'minutes' | 'seconds';

// A whole number of the given unit, or with a colon, one unit up: in minutes, 80 and 1:20 are the same;
// in seconds, 90 and 1:30 are. Nothing else: no decimals, no written-out units. Returns milliseconds, or null.
export function parseDuration(input: string, unit: Unit = 'minutes'): number | null {
  const text = input.trim();
  const [big, small] = unit === 'minutes' ? [HOUR, MINUTE] : [MINUTE, SECOND];
  const clock = /^(\d+):([0-5]\d)$/.exec(text);
  if (clock) return Number(clock[1]) * big + Number(clock[2]) * small;
  return /^\d+$/.test(text) ? Number(text) * small : null;
}

// A signed adjustment in whole minutes: +5, -2. A missing sign means add.
export function parseAdjustment(input: string): number | null {
  const text = input.trim();
  const sign = text.startsWith('-') || text.startsWith('−') ? -1 : 1;
  const amount = parseDuration(text.replace(/^[+\-−]/, ''));
  return amount ? sign * amount : null;
}

// A threshold in whole seconds, or a whole-number share of the exam. 0 turns that phase off.
export function parseThreshold(input: string, totalMs: number): number | null {
  const percent = /^(\d+)\s*%$/.exec(input.trim());
  if (percent) return Math.round(totalMs * Number(percent[1]) / 100);
  return parseDuration(input, 'seconds');
}

// The step is at least one second: the clock shows nothing finer.
export const parseStep = (input: string): number | null => {
  const step = parseDuration(input, 'seconds');
  return step ? step : null;
};

export const validSetting = (key: keyof TimerSettings, value: string) =>
  (key === 'step' ? parseStep(value) : parseThreshold(value, HOUR)) !== null;

export type Phase = 'normal' | 'half' | 'final';

// What the clock shows with remainingMs left of totalMs. Values round up to the current step,
// so the clock never shows less time than there is, and shows 0:00 only at the end.
export function display(remainingMs: number, totalMs: number, settings: TimerSettings): { shownMs: number; phase: Phase } {
  const remaining = Math.max(0, remainingMs);
  const step = parseStep(settings.step) ?? MINUTE; // settings are checked as they are typed and loaded; this is a fallback
  const half = Math.max(SECOND, Math.floor(step / 2 / SECOND) * SECOND); // 60 → 30, 45 → 22, 1 → 1
  const finalBelow = parseThreshold(settings.finalBelow, totalMs) ?? MINUTE;
  const halfBelow = parseThreshold(settings.halfBelow, totalMs) ?? 0;
  const phase: Phase = remaining <= finalBelow ? 'final' : remaining <= halfBelow ? 'half' : 'normal';
  // Rounding to the coarser steps too keeps the clock from ticking up when a phase begins,
  // when the step is not a multiple of its half (a 45s step has 22s half steps).
  const sizes = phase === 'final' ? [step, half, SECOND] : phase === 'half' ? [step, half] : [step];
  return { shownMs: Math.min(...sizes.map(size => Math.ceil(remaining / size) * size)), phase };
}

// 45:00 below an hour, 1:20:00 from an hour up.
export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / SECOND);
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
