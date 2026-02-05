import type { SerializedError, TraceEvent, TraceSummary } from "../types.ts";

export function summarizeEvents(events: TraceEvent[]): TraceSummary | null {
  const start = events.find((e) => e.type === "trace:start");
  if (!start) return null;
  const end = events.find((e) => e.type === "trace:end");
  return {
    id: start.id as string,
    name: start.name as string,
    status: end ? (end.status as "ok" | "error") : "in_progress",
    duration: end ? (end.duration as number) : undefined,
    spans: events.filter((e) => e.type === "span:start").length,
    ts: start.ts,
    error: end?.error ? (end.error as SerializedError).message : undefined,
  };
}
