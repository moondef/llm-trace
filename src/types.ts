// --- Events ---

export interface SerializedError {
  message: string;
  stack?: string;
}

export interface TraceStartEvent {
  type: "trace:start";
  id: string;
  name: string;
  ts: number;
}

export interface TraceEndEvent {
  type: "trace:end";
  id: string;
  status: "ok" | "error";
  duration: number;
  ts: number;
  error?: SerializedError;
}

export interface SpanStartEvent {
  type: "span:start";
  id: string;
  parent: string;
  name: string;
  ts: number;
}

export interface SpanEndEvent {
  type: "span:end";
  id: string;
  status: "ok" | "error";
  duration: number;
  ts: number;
  error?: SerializedError;
}

export interface CheckpointEvent {
  type: "checkpoint";
  parent: string;
  name: string;
  ts: number;
  data?: unknown;
}

export type TraceEvent = TraceStartEvent | TraceEndEvent | SpanStartEvent | SpanEndEvent | CheckpointEvent;

// --- Dependencies (interfaces for DI) ---

export interface Writer {
  writeEvent(traceId: string, event: TraceEvent): void;
  isSessionActive(): boolean;
}

export interface IdGenerator {
  generate(prefix: string): string;
}

export interface Clock {
  now(): number;
}

// --- Tracer ---

export interface TraceHandle {
  span<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T>;
  checkpoint(name: string, data?: unknown): void;
}

export interface TracerDeps {
  writer: Writer;
  idGenerator: IdGenerator;
  clock: Clock;
}

// --- CLI (Reader side) ---

export interface TraceSummary {
  id: string;
  name: string;
  status: "ok" | "error" | "in_progress";
  duration?: number;
  spans: number;
  ts: number;
  error?: string;
}

export interface TraceTreeNode {
  type: "trace" | "span" | "checkpoint";
  id?: string;
  name: string;
  status?: "ok" | "error" | "in_progress";
  duration?: number;
  ts: number;
  data?: unknown;
  error?: SerializedError;
  children: TraceTreeNode[];
}

export interface ListOptions {
  errors?: boolean;
  name?: string;
  last?: number;
}

// --- Factory return types ---

export interface Tracer {
  trace<T>(name: string, fn: (handle: TraceHandle) => Promise<T>): Promise<T>;
}

export interface TraceReader {
  listTraces(options?: ListOptions): Promise<TraceSummary[]>;
  readTrace(id: string): Promise<TraceTreeNode>;
}

export interface TraceServer {
  start(port: number): Promise<number>;
  stop(): Promise<void>;
}
