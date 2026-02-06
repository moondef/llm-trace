import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type StartResult = { created: false; reason: "already_active" } | { created: true; port?: number };

export async function startSession(projectDir: string, options: { skipServer?: boolean } = {}): Promise<StartResult> {
  const logDir = join(projectDir, ".llm-trace-logs");
  if (existsSync(logDir)) return { created: false, reason: "already_active" };
  mkdirSync(logDir, { recursive: true });

  const gitignorePath = join(projectDir, ".gitignore");
  if (existsSync(gitignorePath)) {
    if (!readFileSync(gitignorePath, "utf-8").includes(".llm-trace-logs/"))
      appendFileSync(gitignorePath, "\n.llm-trace-logs/\n");
  } else {
    writeFileSync(gitignorePath, ".llm-trace-logs/\n");
  }

  if (!options.skipServer) {
    const port = parseInt(process.env.LLM_TRACE_PORT || "", 10) || 13579;
    const script = join(fileURLToPath(import.meta.url), "..", "standalone.js");
    const child = spawn(process.execPath, [script], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, LLM_TRACE_PORT: String(port), TRACE_AI_DIR: logDir },
    });
    child.unref();
    writeFileSync(join(logDir, ".server"), JSON.stringify({ pid: child.pid, port }));
    return { created: true, port };
  }
  return { created: true };
}

export async function runStart() {
  const result = await startSession(process.cwd());
  if (!result.created) console.log("Session already active.");
  else console.log(`Session started.${result.port ? ` Browser server on port ${result.port}.` : ""}`);
}
