// src/index.ts
import { createTracer } from './core/tracer.ts'
import { createHttpWriter } from './writers/http-writer.ts'
import { createCryptoIdGenerator } from './utils/id.ts'
import { createSystemClock } from './utils/clock.ts'

export { createTracer } from './core/tracer.ts'
export type { TraceHandle, TracerDeps, Writer, IdGenerator, Clock, TraceEvent } from './types.ts'

const DEFAULT_PORT = 13579
const port = (typeof process !== 'undefined' && process.env?.TRACE_AI_PORT) || DEFAULT_PORT
const serverUrl = `http://127.0.0.1:${port}`

const defaultTracer = createTracer({
  writer: createHttpWriter(serverUrl),
  idGenerator: createCryptoIdGenerator(),
  clock: createSystemClock(),
})

export const trace = defaultTracer.trace
