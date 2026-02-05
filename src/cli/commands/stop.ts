import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export async function stopSession(projectDir: string) {
  const logDir = join(projectDir, ".trace-ai-logs");
  if (!existsSync(logDir)) return { stopped: false, noSession: true };

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
  if (r.noSession) console.log("No active session.");
  else console.log("Session stopped. All traces deleted.");
}
