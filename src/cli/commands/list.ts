import { existsSync } from "node:fs";
import { join } from "node:path";
import { createNdjsonReader } from "../../readers/ndjson-reader.ts";
import { formatTraceList } from "../formatter.ts";

export async function getFormattedList(logDir: string, options: Record<string, string | boolean>) {
  const reader = createNdjsonReader(logDir);
  const traces = await reader.listTraces({
    errors: options.errors === true,
    name: typeof options.name === "string" ? options.name : undefined,
    last: typeof options.last === "string" ? parseInt(options.last, 10) : undefined,
  });
  return formatTraceList(traces, options.human === true);
}

export async function runList(options: Record<string, string | boolean>) {
  const logDir = join(process.cwd(), ".llm-trace-logs");
  if (!existsSync(logDir)) {
    console.log("No active session.");
    return;
  }
  console.log(await getFormattedList(logDir, options));
}
