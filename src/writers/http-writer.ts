import type { TraceEvent, Writer } from "../types.ts";

const FLUSH_INTERVAL_MS = 100;

export function createHttpWriter(serverUrl: string): Writer & { flush(): Promise<void> } {
  let buffer: string[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let warned = false;
  // Chains flush operations so concurrent flushes don't interleave
  let flushChain: Promise<void> = Promise.resolve();

  async function sendBuffer(): Promise<void> {
    if (buffer.length === 0) return;
    const body = buffer.join("\n");
    buffer = [];
    try {
      await globalThis.fetch(`${serverUrl}/traces`, {
        method: "POST",
        headers: { "Content-Type": "application/x-ndjson" },
        body,
      });
    } catch {
      if (!warned) {
        console.warn("[llm-trace] Server not running, traces disabled.");
        warned = true;
      }
    }
  }

  function flush(): Promise<void> {
    flushChain = flushChain.then(() => sendBuffer());
    return flushChain;
  }

  return {
    // Always returns true — the SDK optimistically sends events.
    // If the server isn't running, sendBuffer catches and warns once.
    isSessionActive(): boolean {
      return true;
    },

    writeEvent(traceId: string, event: TraceEvent): void {
      buffer.push(JSON.stringify({ ...event, traceId }));
      if (event.type === "trace:end") {
        flush();
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          flush();
        }, FLUSH_INTERVAL_MS);
      }
    },

    flush,
  };
}
