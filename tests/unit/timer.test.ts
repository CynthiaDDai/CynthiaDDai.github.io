import { describe, expect, it } from 'vitest';
import { defaultSettings, display, formatClock, parseAdjustment, parseDuration, parseStep, parseThreshold, validSetting } from '../../src/timer/time';
import { blocks } from '../../src/timer/markdown';
import { executeCommand, type CommandContext } from '../../src/lib/terminal/registry';

const s = 1000, m = 60 * s, h = 60 * m;
const shown = (left: number, total = 80 * m, settings = defaultSettings) => {
  const { shownMs, phase } = display(left, total, settings);
  return `${formatClock(shownMs)} ${phase}`;
};

describe('timer input', () => {
  it('reads exam lengths as whole minutes, or hours:minutes', () => {
    expect(parseDuration('80')).toBe(80 * m);
    expect(parseDuration(' 1:20 ')).toBe(80 * m);
    expect(parseDuration('0')).toBe(0);
    for (const bad of ['', 'abc', '1:75', '1:5', '-5', '2.5', '1e3', '90s', '1h30m', '5m']) expect(parseDuration(bad)).toBeNull();
  });
  it('reads countdown steps as whole seconds, at least one', () => {
    expect(parseStep('60')).toBe(m);
    expect(parseStep('1')).toBe(s);
    expect(parseStep('1:30')).toBe(90 * s);
    for (const bad of ['0', '0:00', '0.5', '1.5', '-1', '1s', '']) expect(parseStep(bad)).toBeNull();
  });
  it('reads thresholds as whole seconds or a whole-number share of the exam, where 0 turns the phase off', () => {
    expect(parseThreshold('90', 80 * m)).toBe(90 * s);
    expect(parseThreshold('10%', 80 * m)).toBe(8 * m);
    expect(parseThreshold('0', 80 * m)).toBe(0);
    for (const bad of ['lots', '8m', '1.5', '10.5%', '-10', '%']) expect(parseThreshold(bad, 80 * m)).toBeNull();
  });
  it('reads signed adjustments in whole minutes, adding by default', () => {
    expect(parseAdjustment('+5')).toBe(5 * m);
    expect(parseAdjustment('5')).toBe(5 * m);
    expect(parseAdjustment('-2')).toBe(-2 * m);
    expect(parseAdjustment('−2')).toBe(-2 * m);
    for (const bad of ['+', '0', '+0.5', '-30s']) expect(parseAdjustment(bad)).toBeNull();
  });
  it('accepts only valid settings, so bad saved ones fall back to the defaults', () => {
    expect(validSetting('step', '1')).toBe(true);
    expect(validSetting('step', '0')).toBe(false);
    expect(validSetting('halfBelow', '0')).toBe(true);
    expect(validSetting('finalBelow', '1m')).toBe(false);
  });
});

// Every setting worth trying: steps of 1, an odd step, the default, a long one; thresholds off, small, as shares.
const variety = ['1', '2', '45', '60', '61', '600'].flatMap(step =>
  ['0', '1', '10%', '25%', '100%'].flatMap(halfBelow => ['0', '1', '60', '300'].map(finalBelow => ({ step, halfBelow, finalBelow }))));

describe('timer display', () => {
  it('counts by minutes, then half minutes for the last 10%, then seconds for the last minute', () => {
    expect(shown(80 * m)).toBe('1:20:00 normal');
    expect(shown(44 * m + 1)).toBe('45:00 normal');
    expect(shown(44 * m)).toBe('44:00 normal');
    expect(shown(8 * m + 1)).toBe('9:00 normal');
    expect(shown(8 * m)).toBe('8:00 half');
    expect(shown(7 * m + 31 * s)).toBe('8:00 half');
    expect(shown(7 * m + 29 * s)).toBe('7:30 half');
    expect(shown(m + 1)).toBe('1:30 half');
    expect(shown(m)).toBe('1:00 final');
    expect(shown(59 * s + 1)).toBe('1:00 final');
    expect(shown(12 * s + 400)).toBe('0:13 final');
    expect(shown(0)).toBe('0:00 final');
    expect(shown(-5 * s)).toBe('0:00 final');
  });
  it('with a step of 1, counts every second in every phase: half of 1 is still 1', () => {
    const everySecond = { ...defaultSettings, step: '1' };
    expect(shown(44 * m + 30 * s + 1, 80 * m, everySecond)).toBe('44:31 normal');
    expect(shown(7 * m + 29 * s + 1, 80 * m, everySecond)).toBe('7:30 half');
    expect(shown(7 * m + 28 * s + 1, 80 * m, everySecond)).toBe('7:29 half');
    expect(shown(59 * s, 80 * m, everySecond)).toBe('0:59 final');
    for (let left = 80 * m; left > 0; left -= 1000) expect(display(left, 80 * m, everySecond).shownMs).toBe(left);
  });
  it('halves an odd step by rounding down, without ticking up when half steps begin', () => {
    const odd = { step: '45', halfBelow: '600', finalBelow: '60' };
    expect(shown(10 * m + 1, 80 * m, odd)).toBe('10:30 normal');
    expect(shown(10 * m, 80 * m, odd)).toBe('10:16 half'); // 22-second steps, counted down to 0:00
    expect(shown(9 * m + 50 * s, 80 * m, odd)).toBe('9:54 half');
  });
  it('turns phases off with 0', () => {
    expect(shown(5 * m, 80 * m, { step: '60', halfBelow: '0', finalBelow: '60' })).toBe('5:00 normal');
    expect(shown(30 * s + 1, 80 * m, { step: '60', halfBelow: '0', finalBelow: '0' })).toBe('1:00 normal');
    expect(shown(0, 80 * m, { step: '60', halfBelow: '0', finalBelow: '0' })).toBe('0:00 final'); // the end is always red
  });
  it('drops the half-step phase when 10% is under a minute', () => {
    expect(shown(2 * m - 1, 5 * m)).toBe('2:00 normal');
    expect(shown(m, 5 * m)).toBe('1:00 final');
  });
  it('follows custom settings', () => {
    const custom = { step: '300', halfBelow: '1200', finalBelow: '120' };
    expect(shown(30 * m + 1, 80 * m, custom)).toBe('35:00 normal');
    expect(shown(19 * m, 80 * m, custom)).toBe('20:00 half');
    expect(shown(m + 59 * s, 80 * m, custom)).toBe('1:59 final');
  });
  it('for every setting: shows whole seconds, never less time than is left, never ticks up, and ends at 0:00', () => {
    const problems: string[] = [];
    for (const settings of variety) {
      for (const total of [5 * m, 80 * m]) {
        let previous = Infinity;
        for (let left = total; left >= -1000; left -= 250) {
          const { shownMs } = display(left, total, settings);
          if (shownMs % 1000 || shownMs < left || shownMs > previous) problems.push(`${JSON.stringify(settings)} ${total} ${left} → ${shownMs}`);
          previous = shownMs;
        }
        if (previous !== 0) problems.push(`${JSON.stringify(settings)} ends at ${previous}`);
      }
    }
    expect(problems.slice(0, 5)).toEqual([]);
  });
});

describe('timer announcements', () => {
  const source = 'No calculators.\n\n- Problem 2: $x_1*y_2$\n- Problem 5 is **optional**\n\n$$\\int_0^1 f$$\n\nThis costs \\$5\nsecond line\n';
  it('cuts the text into blocks that point back at their source', () => {
    const parts = blocks(source);
    expect(parts.map(part => source.slice(part.start, part.end))).toEqual([
      'No calculators.', '- Problem 2: $x_1*y_2$\n- Problem 5 is **optional**', '$$\\int_0^1 f$$', 'This costs \\$5\nsecond line',
    ]);
  });
  it('renders Markdown and math, leaving math alone inside', () => {
    const [, list, display, last] = blocks(source).map(part => part.html);
    expect(list).toContain('<ul>');
    expect(list).toContain('class="katex"');
    expect(list).not.toContain('<em>');
    expect(list).toContain('<strong>optional</strong>');
    expect(display).toContain('katex-display');
    expect(last).toContain('This costs $5<br>');
    expect(last).not.toContain('katex');
  });
  it('shows bad LaTeX as an error instead of failing', () => {
    expect(blocks('$\\frac{1}{$').at(0)!.html).toContain('katex-error');
  });
  it('has no blocks for blank text', () => {
    expect(blocks('')).toEqual([]);
    expect(blocks('\n\n  \n')).toEqual([]);
  });
});

describe('timer command', () => {
  it('opens /timer', () => {
    expect(executeCommand('timer', {} as CommandContext)).toEqual({ kind: 'navigation', path: '/timer' });
  });
});
