import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getSessionStatus(projectDir: string) {
  const logDir = join(projectDir, ".trace-ai-logs");
  if (!existsSync(logDir)) return { active: false };

  const files = readdirSync(logDir).filter((f) => f.endsWith(".ndjson"));
  let errorCount = 0;
  for (const file of files) {
    if (readFileSync(join(logDir, file), "utf-8").includes('"status":"error"')) errorCount++;
  }

  let serverPort: number | undefined;
  const sf = join(logDir, ".server");
  if (existsSync(sf)) {
    try {
      serverPort = JSON.parse(readFileSync(sf, "utf-8")).port;
    } catch {}
  }

  return { active: true, traceCount: files.length, errorCount, serverPort };
}

export async function runStatus() {
  const s = getSessionStatus(process.cwd());
  if (!s.active) {
    console.log("No active session.");
    return;
  }
  console.log(`Session active.\nTraces: ${s.traceCount} (${s.errorCount} errors)`);
  if (s.serverPort) console.log(`Browser server: port ${s.serverPort}`);
}
