export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: string | null = null;
  let started = false;
  for (const char of input.trim()) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (/\s/.test(char)) {
      if (started) { tokens.push(current); current = ''; started = false; }
    } else {
      if ('|><;&`'.includes(char)) throw new Error('Use one site command at a time. Shell operators are not supported.');
      current += char; started = true;
    }
  }
  if (quote) throw new Error('Close the quoted text before running the command.');
  if (started) tokens.push(current);
  return tokens;
}
