import type { TraceEndEvent, TraceEvent, TraceStartEvent, TraceSummary } from "../types.ts";

export function summarizeEvents(events: TraceEvent[]): TraceSummary | null {
  const start = events.find((e): e is TraceStartEvent => e.type === "trace:start");
  if (!start) return null;
  const end = events.find((e): e is TraceEndEvent => e.type === "trace:end");
  return {
    id: start.id,
    name: start.name,
    status: end ? end.status : "in_progress",
    duration: end ? end.duration : undefined,
    spans: events.filter((e) => e.type === "span:start").length,
    ts: start.ts,
    error: end?.error ? end.error.message : undefined,
  };
}
