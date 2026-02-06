import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { stopSession } from "./stop.ts";

describe("stopSession", () => {
  let testDir: string;
  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "llm-trace-stop-"));
  });
  afterEach(() => {
    rmSync(testDir, { recursive: true });
  });

  it("deletes .llm-trace-logs", async () => {
    mkdirSync(join(testDir, ".llm-trace-logs"));
    const r = await stopSession(testDir);
    assert.equal(r.stopped, true);
    assert.equal(existsSync(join(testDir, ".llm-trace-logs")), false);
  });

  it("reports no session", async () => {
    const r = await stopSession(testDir);
    assert.equal(r.stopped, false);
    assert.equal(r.reason, "no_session");
  });
});
