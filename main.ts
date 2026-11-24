import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Competition gate: the sealed scorer accepts 1 to 200 characters.
export const MIN_CHARS = 1;
export const MAX_CHARS = 200;

// One-line office joke, at most 200 characters, a single line.
export const ENTRY =
  "IT reset my password again, so now it matches my job satisfaction: expired, and impossible to recover.";

export function validateEntry(text: string): string {
  const chars = [...text].length;
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    throw new Error(
      `entry must be ${MIN_CHARS}-${MAX_CHARS} characters, got ${chars}`,
    );
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
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
