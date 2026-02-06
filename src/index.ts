import { createTracer } from "./core/tracer.ts";
import { createSystemClock } from "./utils/clock.ts";
import { createCryptoIdGenerator } from "./utils/id.ts";
import { createHttpWriter } from "./writers/http-writer.ts";

export { createTracer } from "./core/tracer.ts";
export type { Clock, IdGenerator, TraceEvent, TraceHandle, Tracer, TracerDeps, Writer } from "./types.ts";

const DEFAULT_PORT = 13579;
const envPort = typeof process !== "undefined" ? parseInt(process.env?.LLM_TRACE_PORT || "", 10) : NaN;
const serverUrl = `http://127.0.0.1:${envPort || DEFAULT_PORT}`;

const defaultTracer = createTracer({
  writer: createHttpWriter(serverUrl),
  idGenerator: createCryptoIdGenerator(),
  clock: createSystemClock(),
});

export const trace = defaultTracer.trace;
