import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SessionStatus =
  | { active: false }
  | { active: true; traceCount: number; errorCount: number; serverPort?: number };

export function getSessionStatus(projectDir: string): SessionStatus {
  const logDir = join(projectDir, ".llm-trace-logs");
  if (!existsSync(logDir)) return { active: false };

  const files = readdirSync(logDir).filter((f) => f.endsWith(".ndjson"));
  let errorCount = 0;
  for (const file of files) {
    if (readFileSync(join(logDir, file), "utf-8").includes('"status":"error"')) errorCount++;
  }

  let serverPort: number | undefined;
  const serverFile = join(logDir, ".server");
  if (existsSync(serverFile)) {
    try {
      serverPort = JSON.parse(readFileSync(serverFile, "utf-8")).port;
    } catch {}
  }

  return { active: true, traceCount: files.length, errorCount, serverPort };
}

export async function runStatus() {
  const status = getSessionStatus(process.cwd());
  if (!status.active) {
    console.log("No active session.");
    return;
  }
  console.log(`Session active.\nTraces: ${status.traceCount} (${status.errorCount} errors)`);
  if (status.serverPort) console.log(`Browser server: port ${status.serverPort}`);
}
