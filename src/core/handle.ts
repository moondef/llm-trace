import type { TraceHandle, TracerDeps } from "../types.ts";
import { serializeError } from "../utils/errors.ts";

const MAX_CHECKPOINT_BYTES = 64 * 1024;

export function createHandle(deps: TracerDeps, traceId: string, parentId: string): TraceHandle {
  return {
    async span<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
      const spanId = deps.idGenerator.generate("s");
      const startTime = deps.clock.now();

      deps.writer.writeEvent(traceId, {
        type: "span:start",
        id: spanId,
        parent: parentId,
        name,
        ts: startTime,
      });

      const childHandle = createHandle(deps, traceId, spanId);

      try {
        const result = await fn(childHandle);
        const endTime = deps.clock.now();
        deps.writer.writeEvent(traceId, {
          type: "span:end",
          id: spanId,
          duration: endTime - startTime,
          status: "ok",
          ts: endTime,
        });
        return result;
      } catch (error) {
        const endTime = deps.clock.now();
        deps.writer.writeEvent(traceId, {
          type: "span:end",
          id: spanId,
          duration: endTime - startTime,
          status: "error",
          error: serializeError(error),
          ts: endTime,
        });
        throw error;
      }
    },

    checkpoint(name: string, data?: unknown): void {
      let serialized = data;
      if (data !== undefined) {
        try {
          const json = JSON.stringify(data);
          if (json.length > MAX_CHECKPOINT_BYTES) {
            serialized = { _truncated: true, _originalSize: json.length };
          }
        } catch {
          serialized = { _serializationError: true };
        }
      }
      deps.writer.writeEvent(traceId, {
        type: "checkpoint",
        parent: parentId,
        name,
        data: serialized,
        ts: deps.clock.now(),
      });
    },
  };
}

export function createNoopHandle(): TraceHandle {
  return {
    async span<T>(_name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
      return fn(createNoopHandle());
    },
    checkpoint(): void {},
  };
}
