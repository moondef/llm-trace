import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export type StopResult = { stopped: false; reason: "no_session" } | { stopped: true };

export async function stopSession(projectDir: string): Promise<StopResult> {
  const logDir = join(projectDir, ".trace-ai-logs");
  if (!existsSync(logDir)) return { stopped: false, reason: "no_session" };

  const serverFile = join(logDir, ".server");
  if (existsSync(serverFile)) {
    try {
      const { pid } = JSON.parse(readFileSync(serverFile, "utf-8"));
      if (pid) process.kill(pid, "SIGTERM");
    } catch {}
  }

  rmSync(logDir, { recursive: true });
  return { stopped: true };
}

export async function runStop() {
  const r = await stopSession(process.cwd());
  if (!r.stopped) console.log("No active session.");
  else console.log("Session stopped. All traces deleted.");
}
