import { existsSync } from "node:fs";
import { join } from "node:path";
import { createNdjsonReader } from "../../readers/ndjson-reader.ts";
import { formatTraceTree } from "../formatter.ts";

export async function runShow(id: string, options: Record<string, string | boolean>) {
  const logDir = join(process.cwd(), ".trace-ai-logs");
  if (!existsSync(logDir)) {
    console.log("No active session.");
    return;
  }
  const reader = createNdjsonReader(logDir);
  const tree = await reader.readTrace(id);
  console.log(formatTraceTree(tree, options.human === true));
}
