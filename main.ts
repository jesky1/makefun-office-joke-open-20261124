import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The sealed scorer accepts a single office joke of 1 to 200 characters.
export const MIN_CHARS = 1;
export const MAX_CHARS = 200;

// One-line office joke. Must stay exactly this text: 102 characters,
// a single line, no trailing newline, no leading/trailing whitespace.
export const ENTRY =
  "IT reset my password again, so now it matches my job satisfaction: expired, and impossible to recover.";

// Characters that may never appear in a valid entry: newline, carriage
// return, tab, and every other C0 control character plus DEL, plus the
// Unicode line and paragraph separators U+2028 and U+2029.
const FORBIDDEN = /[\u0000-\u001f\u007f\u2028\u2029]/;

export function validateEntry(text: string): string {
  const chars = [...text].length;
  if (chars < MIN_CHARS) {
    throw new Error(`entry must be at least ${MIN_CHARS} character`);
  }
  if (chars > MAX_CHARS) {
    throw new Error(`entry must be at most ${MAX_CHARS} characters, got ${chars}`);
  }
  if (FORBIDDEN.test(text)) {
    throw new Error("entry must not contain control characters or newlines");
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (text !== text.trim()) {
    throw new Error("entry must not have leading or trailing whitespace");
  }
  return text;
}

export function outputDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR || "/output";
}

export function main(): string {
  const entry = validateEntry(ENTRY);
  const dir = outputDir();
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "entry.txt");
  writeFileSync(file, entry, "utf8");
  return file;
}

main();
