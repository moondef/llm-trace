import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { startSession } from "./start.ts";

describe("startSession", () => {
  let testDir: string;
  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "llm-trace-start-"));
  });
  afterEach(() => {
    rmSync(testDir, { recursive: true });
  });

  it("creates .llm-trace-logs directory", async () => {
    const r = await startSession(testDir, { skipServer: true });
    assert.equal(r.created, true);
    assert.ok(existsSync(join(testDir, ".llm-trace-logs")));
  });

  it("reports already active", async () => {
    mkdirSync(join(testDir, ".llm-trace-logs"));
    const r = await startSession(testDir, { skipServer: true });
    assert.equal(r.created, false);
    assert.equal(r.reason, "already_active");
  });

  it("adds to .gitignore", async () => {
    writeFileSync(join(testDir, ".gitignore"), "node_modules/\n");
    await startSession(testDir, { skipServer: true });
    assert.ok(readFileSync(join(testDir, ".gitignore"), "utf-8").includes(".llm-trace-logs/"));
  });

  it("does not duplicate in .gitignore", async () => {
    writeFileSync(join(testDir, ".gitignore"), ".llm-trace-logs/\n");
    await startSession(testDir, { skipServer: true });
    const count = readFileSync(join(testDir, ".gitignore"), "utf-8").split(".llm-trace-logs/").length - 1;
    assert.equal(count, 1);
  });
});
