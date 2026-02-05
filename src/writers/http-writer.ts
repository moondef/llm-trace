// src/writers/http-writer.ts
import type { Writer, TraceEvent } from '../types.ts'

const FLUSH_INTERVAL_MS = 100

export function createHttpWriter(serverUrl: string): Writer & { flush(): Promise<void> } {
  let buffer: string[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let warned = false
  let inflight: Promise<void> = Promise.resolve()

  async function sendBuffer(): Promise<void> {
    if (buffer.length === 0) return
    const body = buffer.join('\n')
    buffer = []
    try {
      await globalThis.fetch(`${serverUrl}/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body,
      })
    } catch {
      if (!warned) {
        console.warn('[trace-ai] Server not running, traces disabled.')
        warned = true
      }
    }
  }

  function flush(): Promise<void> {
    inflight = inflight.then(() => sendBuffer())
    return inflight
  }

  return {
    isSessionActive(): boolean {
      return true // Server handles the truth — SDK always tries
    },

    writeEvent(traceId: string, event: TraceEvent): void {
      buffer.push(JSON.stringify({ ...event, traceId }))
      if (event.type === 'trace:end') {
        flush()
      } else if (!timer) {
        timer = setTimeout(() => { timer = null; flush() }, FLUSH_INTERVAL_MS)
      }
    },

    flush,
  }
}
