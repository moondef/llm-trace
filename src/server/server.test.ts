import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createTraceServer } from "./server.ts";

function post(port: number, body: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path: "/traces", method: "POST" }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode! }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

describe("createTraceServer", () => {
  let testDir: string;
  let logDir: string;
  let server: ReturnType<typeof createTraceServer>;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "llm-trace-server-"));
    logDir = join(testDir, ".llm-trace-logs");
    mkdirSync(logDir);
  });

  afterEach(async () => {
    if (server) await server.stop();
    rmSync(testDir, { recursive: true });
  });

  it("writes events to correct trace file", async () => {
    server = createTraceServer(logDir);
    const port = await server.start(0);

    const events = [
      JSON.stringify({ type: "trace:start", id: "t-1", traceId: "t-1", name: "test", ts: 1000 }),
      JSON.stringify({ type: "checkpoint", parent: "t-1", traceId: "t-1", name: "data", ts: 1010 }),
      JSON.stringify({ type: "trace:end", id: "t-1", traceId: "t-1", duration: 50, status: "ok", ts: 1050 }),
    ].join("\n");

    const res = await post(port, events);
    assert.equal(res.status, 200);
    assert.ok(existsSync(join(logDir, "t-1.ndjson")));
    const lines = readFileSync(join(logDir, "t-1.ndjson"), "utf-8").trim().split("\n");
    assert.equal(lines.length, 3);
  });

  it("handles CORS preflight", async () => {
    server = createTraceServer(logDir);
    const port = await server.start(0);
    const res = await new Promise<http.IncomingMessage>((resolve) => {
      http.request({ hostname: "127.0.0.1", port, path: "/traces", method: "OPTIONS" }, resolve).end();
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.headers["access-control-allow-origin"], "*");
  });

  it("returns 404 for unknown routes", async () => {
    server = createTraceServer(logDir);
    const port = await server.start(0);
    const res = await new Promise<http.IncomingMessage>((resolve) => {
      http.request({ hostname: "127.0.0.1", port, path: "/unknown", method: "GET" }, resolve).end();
    });
    assert.equal(res.statusCode, 404);
  });
});
