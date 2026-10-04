export class CommandHistory {
  entries: string[] = [];
  cursor = 0;
  pending = '';
  constructor() {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem('command-history') || '[]');
      if (Array.isArray(saved)) this.entries = saved.filter((item): item is string => typeof item === 'string');
    } catch { /* Private browsing and storage limits must not break navigation. */ }
    this.cursor = this.entries.length;
  }
  add(value: string) {
    if (value && this.entries.at(-1) !== value) this.entries.push(value);
    this.cursor = this.entries.length;
    this.pending = '';
    try { sessionStorage.setItem('command-history', JSON.stringify(this.entries)); } catch { /* Optional storage. */ }
  }
  move(direction: -1 | 1, current: string): string {
    if (this.cursor === this.entries.length) this.pending = current;
    this.cursor = Math.max(0, Math.min(this.entries.length, this.cursor + direction));
    return this.cursor === this.entries.length ? this.pending : this.entries[this.cursor];
  }
}
