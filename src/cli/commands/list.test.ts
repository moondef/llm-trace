import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { getFormattedList } from "./list.ts";

describe("getFormattedList", () => {
  let logDir: string;
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "trace-ai-list-"));
    logDir = join(testDir, ".trace-ai-logs");
    mkdirSync(logDir);
  });
  afterEach(() => {
    rmSync(testDir, { recursive: true });
  });

  it("returns JSON traces", async () => {
    writeFileSync(
      join(logDir, "api-1.ndjson"),
      `${[
        JSON.stringify({ type: "trace:start", id: "api-1", name: "api", ts: 1000 }),
        JSON.stringify({ type: "trace:end", id: "api-1", duration: 50, status: "ok", ts: 1050 }),
      ].join("\n")}\n`,
    );
    const output = await getFormattedList(logDir, {});
    assert.equal(JSON.parse(output)[0].name, "api");
  });
});
