import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Clock, IdGenerator, TraceEvent, Writer } from "../types.ts";
import { createTracer } from "./tracer.ts";

function createMemoryWriter(): Writer & { allEvents(): any[] } {
  const events = new Map<string, any[]>();
  return {
    allEvents: () => [...events.values()].flat(),
    isSessionActive: () => true,
    writeEvent(traceId: string, event: TraceEvent) {
      if (!events.has(traceId)) events.set(traceId, []);
      events.get(traceId)?.push(event);
    },
  };
}

function createSeqId(): IdGenerator {
  let c = 0;
  return { generate: (p: string) => `${p}-${String(++c).padStart(6, "0")}` };
}

function createFakeClock(start = 1000): Clock & { advance(ms: number): void } {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("createTracer", () => {
  it("writes trace:start and trace:end", async () => {
    const writer = createMemoryWriter();
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock: createFakeClock() });
    await trace("my-trace", async () => {});
    const events = writer.allEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, "trace:start");
    assert.equal(events[1].type, "trace:end");
    assert.equal(events[1].status, "ok");
  });

  it("records duration", async () => {
    const writer = createMemoryWriter();
    const clock = createFakeClock();
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock });
    await trace("test", async () => {
      clock.advance(50);
    });
    assert.equal(writer.allEvents()[1].duration, 50);
  });

  it("returns callback result", async () => {
    const { trace } = createTracer({
      writer: createMemoryWriter(),
      idGenerator: createSeqId(),
      clock: createFakeClock(),
    });
    const result = await trace("test", async () => 42);
    assert.equal(result, 42);
  });

  it("records error and re-throws", async () => {
    const writer = createMemoryWriter();
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock: createFakeClock() });
    await assert.rejects(
      () =>
        trace("fail", async () => {
          throw new Error("boom");
        }),
      { message: "boom" },
    );
    const end = writer.allEvents()[1];
    assert.equal(end.status, "error");
    assert.equal((end.error as any).message, "boom");
  });

  it("full trace with spans and checkpoints", async () => {
    const writer = createMemoryWriter();
    const clock = createFakeClock();
    const { trace } = createTracer({ writer, idGenerator: createSeqId(), clock });

    await trace("api-users", async (t) => {
      t.checkpoint("request", { method: "GET" });
      clock.advance(10);
      await t.span("db-query", async (s) => {
        clock.advance(20);
        s.checkpoint("result", { rows: 5 });
        clock.advance(5);
      });
      clock.advance(5);
    });

    const events = writer.allEvents();
    assert.equal(events.length, 6);
    assert.equal(events[0].type, "trace:start");
    assert.equal(events[1].parent, "api-users-000001"); // checkpoint parented to trace
    assert.equal(events[3].parent, "s-000002"); // checkpoint parented to span
    assert.equal(events[4].duration, 25);
    assert.equal(events[5].duration, 40);
  });

  it("no-ops when session inactive", async () => {
    const writer = createMemoryWriter();
    const inactiveWriter = { ...writer, isSessionActive: () => false };
    const { trace } = createTracer({ writer: inactiveWriter, idGenerator: createSeqId(), clock: createFakeClock() });

    const result = await trace("test", async (t) => {
      t.checkpoint("data", { x: 1 });
      await t.span("inner", async () => {});
      return "hello";
    });

    assert.equal(result, "hello");
    assert.equal(writer.allEvents().length, 0);
  });
});
