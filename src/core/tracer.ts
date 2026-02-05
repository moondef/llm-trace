// src/core/tracer.ts
import type { TracerDeps, TraceHandle } from '../types.ts'
import { createHandle, createNoopHandle } from './handle.ts'

function serializeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack }
  return { message: String(err) }
}

export function createTracer(deps: TracerDeps) {
  async function trace<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T> {
    if (!deps.writer.isSessionActive()) {
      return fn(createNoopHandle())
    }

    const traceId = deps.idGenerator.generate(name)
    const startTime = deps.clock.now()

    deps.writer.writeEvent(traceId, {
      type: 'trace:start', id: traceId, name, ts: startTime,
    })

    const handle = createHandle(deps, traceId, traceId)

    try {
      const result = await fn(handle)
      deps.writer.writeEvent(traceId, {
        type: 'trace:end', id: traceId, duration: deps.clock.now() - startTime, status: 'ok', ts: deps.clock.now(),
      })
      return result
    } catch (error) {
      deps.writer.writeEvent(traceId, {
        type: 'trace:end', id: traceId, duration: deps.clock.now() - startTime, status: 'error',
        error: serializeError(error), ts: deps.clock.now(),
      })
      throw error
    }
  }

  return { trace }
}
