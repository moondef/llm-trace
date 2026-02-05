// src/core/handle.ts
import type { TraceHandle, TracerDeps } from '../types.ts'

function serializeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack }
  return { message: String(err) }
}

export function createHandle(deps: TracerDeps, traceId: string, parentId: string): TraceHandle {
  return {
    async span<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
      const spanId = deps.idGenerator.generate('s')
      const startTime = deps.clock.now()

      deps.writer.writeEvent(traceId, {
        type: 'span:start', id: spanId, parent: parentId, name, ts: startTime,
      })

      const childHandle = createHandle(deps, traceId, spanId)

      try {
        const result = await fn(childHandle)
        deps.writer.writeEvent(traceId, {
          type: 'span:end', id: spanId, duration: deps.clock.now() - startTime, status: 'ok', ts: deps.clock.now(),
        })
        return result
      } catch (error) {
        deps.writer.writeEvent(traceId, {
          type: 'span:end', id: spanId, duration: deps.clock.now() - startTime, status: 'error',
          error: serializeError(error), ts: deps.clock.now(),
        })
        throw error
      }
    },

    checkpoint(name: string, data?: unknown): void {
      let serialized = data
      if (data !== undefined) {
        try { JSON.stringify(data) } catch { serialized = { _serializationError: true } }
      }
      deps.writer.writeEvent(traceId, {
        type: 'checkpoint', parent: parentId, name, data: serialized, ts: deps.clock.now(),
      })
    },
  }
}

export function createNoopHandle(): TraceHandle {
  return {
    async span<T>(_name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
      return fn(createNoopHandle())
    },
    checkpoint(): void {},
  }
}
