import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ENTRY, MAX_CHARS, MIN_CHARS, validateEntry } from "./main.ts";

// Run the program once into a fresh temp dir and return entry.txt bytes.
function runOnce() {
  const dir = mkdtempSync(join(tmpdir(), "office-joke-open-"));
  const result = spawnSync(process.execPath, ["main.ts"], {
    cwd: import.meta.dirname,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `main.ts failed: ${result.stderr}`);
  return readFileSync(join(dir, "entry.txt"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("entry is one line, 1-200 chars, byte-identical across two runs", () => {
  const first = runOnce();
  const second = runOnce();
  assert.equal(
    sha256(first),
    sha256(second),
    "two runs must produce byte-identical entry.txt",
  );
  const text = first.toString("utf8");
  assert.equal(text, ENTRY, "entry.txt must equal the ENTRY constant");
  assert.equal(
    text,
    "IT reset my password again, so now it matches my job satisfaction: expired, and impossible to recover.",
    "entry text must be unchanged",
  );
  assert.ok(!text.endsWith("\n"), "no trailing newline");
  assert.equal(text.split("\n").length, 1, "exactly one line");
  const chars = [...text].length;
  assert.ok(chars >= MIN_CHARS, `length ${chars} must be >= ${MIN_CHARS}`);
  assert.ok(chars <= MAX_CHARS, `length ${chars} must be <= ${MAX_CHARS}`);
  assert.equal(chars, 102, "entry is 102 characters");
  assert.ok(text.trim().length > 0, "not only whitespace");
  assert.equal(text, text.trim(), "no leading or trailing whitespace");
});

test("validator accepts a boundary entry of exactly 200 characters", () => {
  assert.equal(validateEntry("y".repeat(200)), "y".repeat(200));
});

test("validator accepts a one-character entry", () => {
  assert.equal(validateEntry("!"), "!");
});

test("validator rejects an entry over 200 characters", () => {
  assert.throws(() => validateEntry("x".repeat(201)), /at most 200/);
});

test("validator rejects an empty entry", () => {
  assert.throws(() => validateEntry(""), /at least 1/);
});

test("validator rejects a whitespace-only entry", () => {
  assert.throws(() => validateEntry("   "), /only whitespace/);
  assert.throws(() => validateEntry("\t"), /control characters|only whitespace/);
});

test("validator rejects leading or trailing whitespace", () => {
  assert.throws(() => validateEntry(" joke"), /leading or trailing/);
  assert.throws(() => validateEntry("joke "), /leading or trailing/);
});

test("validator rejects a multi-line entry", () => {
  assert.throws(() => validateEntry("line one\nline two"), /control characters|single line/);
  assert.throws(() => validateEntry("line one\rline two"), /control characters|single line/);
});

test("validator rejects control characters", () => {
  assert.throws(() => validateEntry("joke\x00here"), /control characters/);
  assert.throws(() => validateEntry("joke\x07here"), /control characters/);
  assert.throws(() => validateEntry("joke\x7fhere"), /control characters/);
  assert.throws(() => validateEntry("joke\u2028here"), /control characters/);
  assert.throws(() => validateEntry("joke\u2029here"), /control characters/);
});
