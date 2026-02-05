import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { startSession } from "./start.ts";

describe("startSession", () => {
  let testDir: string;
  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "trace-ai-start-"));
  });
  afterEach(() => {
    rmSync(testDir, { recursive: true });
  });

  it("creates .trace-ai-logs directory", async () => {
    const r = await startSession(testDir, { skipServer: true });
    assert.equal(r.created, true);
    assert.ok(existsSync(join(testDir, ".trace-ai-logs")));
  });

  it("reports already active", async () => {
    mkdirSync(join(testDir, ".trace-ai-logs"));
    const r = await startSession(testDir, { skipServer: true });
    assert.equal(r.alreadyActive, true);
  });

  it("adds to .gitignore", async () => {
    writeFileSync(join(testDir, ".gitignore"), "node_modules/\n");
    await startSession(testDir, { skipServer: true });
    assert.ok(readFileSync(join(testDir, ".gitignore"), "utf-8").includes(".trace-ai-logs/"));
  });

  it("does not duplicate in .gitignore", async () => {
    writeFileSync(join(testDir, ".gitignore"), ".trace-ai-logs/\n");
    await startSession(testDir, { skipServer: true });
    const count = readFileSync(join(testDir, ".gitignore"), "utf-8").split(".trace-ai-logs/").length - 1;
    assert.equal(count, 1);
  });
});
