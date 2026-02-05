import type { TraceHandle, TracerDeps } from "../types.ts";
import { serializeError } from "../utils/errors.ts";
import { createHandle, createNoopHandle } from "./handle.ts";

export function createTracer(deps: TracerDeps) {
  async function trace<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
    if (!deps.writer.isSessionActive()) {
      return fn(createNoopHandle());
    }

    const traceId = deps.idGenerator.generate(name);
    const startTime = deps.clock.now();

    deps.writer.writeEvent(traceId, {
      type: "trace:start",
      id: traceId,
      name,
      ts: startTime,
    });

    const handle = createHandle(deps, traceId, traceId);

    try {
      const result = await fn(handle);
      const endTime = deps.clock.now();
      deps.writer.writeEvent(traceId, {
        type: "trace:end",
        id: traceId,
        duration: endTime - startTime,
        status: "ok",
        ts: endTime,
      });
      return result;
    } catch (error) {
      const endTime = deps.clock.now();
      deps.writer.writeEvent(traceId, {
        type: "trace:end",
        id: traceId,
        duration: endTime - startTime,
        status: "error",
        error: serializeError(error),
        ts: endTime,
      });
      throw error;
    }
  }

  return { trace };
}
