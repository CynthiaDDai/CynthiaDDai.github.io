export interface PromptSegment {
  type: string;
  alias?: string;
  style: 'plain' | 'powerline' | 'diamond' | 'accordion' | 'text';
  foreground?: string;
  background?: string;
  foregroundSource?: string;
  backgroundSource?: string;
  foregroundTemplates: string[];
  backgroundTemplates: string[];
  template: string;
  templates?: string[];
  templatesLogic?: 'join' | 'first_match';
  force?: boolean;
  leadingSymbol?: string;
  trailingSymbol?: string;
  invertPowerline?: boolean;
  properties: Record<string, unknown>;
}

export interface PromptLine {
  alignment: 'left' | 'right';
  newline: boolean;
  segments: PromptSegment[];
}

export interface PromptTheme {
  palette: Record<string, string>;
  lines: PromptLine[];
  // Oh My Posh's transient_prompt, as a single plain segment.
  transient?: PromptSegment;
  background?: string;
  warnings: string[];
}

export interface PromptContext {
  user: string;
  host: string;
  cwd: string;
  status: 'ok' | 'error';
  now?: Date;
  pathLinks?: { label: string; path: string }[];
  // A card's state, offered to transient prompts as git fields: working changes (in progress) and behind (a file to pull).
  git?: { working: boolean; behind: boolean };
}

export interface SiteTheme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  terminal: PromptTheme;
  palette: Record<string, string>;
  chrome: { background: string; foreground: string; muted: string; border: string; accent: string };
  prose: { foreground: string; muted: string; link: string; codeBackground: string };
  syntax: { comment: string; string: string; keyword: string; constant: string; function: string; parameter: string };
  mobile?: { terminal: PromptTheme; tokens: Record<string, string>; mode: 'dark' | 'light' };
  mobileFallback?: 'compact' | 'desktop';
}
