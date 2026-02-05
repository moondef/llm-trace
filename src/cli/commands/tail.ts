import { existsSync, readdirSync, readFileSync, watch } from "node:fs";
import { join } from "node:path";
import { summarizeEvents } from "../../readers/summarize.ts";
import type { TraceEvent, TraceSummary } from "../../types.ts";

function summarizeFile(filePath: string): TraceSummary | null {
  try {
    const content = readFileSync(filePath, "utf-8").trim();
    if (!content) return null;
    const events: TraceEvent[] = content.split("\n").map((l) => JSON.parse(l));
    return summarizeEvents(events);
  } catch {
    return null;
  }
}

export async function runTail(options: Record<string, string | boolean>) {
  const logDir = join(process.cwd(), ".trace-ai-logs");
  if (!existsSync(logDir)) {
    console.log("No active session.");
    return;
  }

  console.log("Watching for traces... (Ctrl+C to stop)");
  const seen = new Set(readdirSync(logDir).filter((f) => f.endsWith(".ndjson")));

  watch(logDir, (_event, filename) => {
    if (!filename || !filename.endsWith(".ndjson")) return;
    const summary = summarizeFile(join(logDir, filename));
    if (!summary) return;
    if (options.errors === true && summary.status !== "error") return;
    if (typeof options.name === "string") {
      const re = new RegExp(`^${options.name.replace(/\*/g, ".*")}$`);
      if (!re.test(summary.name)) return;
    }
    if (summary.status !== "in_progress" || !seen.has(filename)) {
      seen.add(filename);
      console.log(JSON.stringify(summary));
    }
  });

  await new Promise(() => {});
}
