import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ENTRY, validateEntry } from "./main.ts";

function runOnce() {
  const dir = mkdtempSync(join(tmpdir(), "office-joke-open-"));
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: import.meta.dirname,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `main.ts failed: ${r.stderr}`);
  return readFileSync(join(dir, "entry.txt"));
}

test("entry is one line, 1-200 chars, deterministic across runs", () => {
  const first = runOnce();
  const second = runOnce();
  assert.equal(
    createHash("sha256").update(first).digest("hex"),
    createHash("sha256").update(second).digest("hex"),
    "two runs must produce byte-identical entry.txt",
  );
  const text = first.toString("utf8");
  assert.equal(text, ENTRY);
  assert.ok(!text.endsWith("\n"), "no trailing newline");
  assert.equal(text.split("\n").length, 1, "exactly one line");
  const chars = [...text].length;
  assert.ok(chars >= 1 && chars <= 200, `length ${chars} must be 1-200`);
  assert.ok(text.trim().length > 0, "not only whitespace");
});

test("validator rejects an entry over 200 characters", () => {
  assert.throws(() => validateEntry("x".repeat(201)), /200/);
});

test("validator rejects a multi-line entry", () => {
  assert.throws(() => validateEntry("line one\nline two"), /single line/);
});
