// src/types.ts

// --- Events ---

export interface TraceEvent {
  type: string
  ts: number
  [key: string]: unknown
}

export interface SerializedError {
  message: string
  stack?: string
}

// --- Dependencies (interfaces for DI) ---

export interface Writer {
  writeEvent(traceId: string, event: TraceEvent): void
  isSessionActive(): boolean
}

export interface IdGenerator {
  generate(prefix: string): string
}

export interface Clock {
  now(): number
}

// --- Tracer ---

export interface TraceHandle {
  span<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T>
  checkpoint(name: string, data?: unknown): void
}

export interface TracerDeps {
  writer: Writer
  idGenerator: IdGenerator
  clock: Clock
}

// --- CLI (Reader side) ---

export interface TraceSummary {
  id: string
  name: string
  status: 'ok' | 'error' | 'in_progress'
  duration?: number
  spans: number
  ts: number
  error?: string
}

export interface TraceTreeNode {
  type: 'trace' | 'span' | 'checkpoint'
  id?: string
  name: string
  status?: 'ok' | 'error' | 'in_progress'
  duration?: number
  ts: number
  data?: unknown
  error?: SerializedError
  children: TraceTreeNode[]
}

export interface ListOptions {
  errors?: boolean
  name?: string
  last?: number
}
