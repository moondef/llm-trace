import { appendFileSync, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import type { TraceServer } from "../types.ts";

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
  });
}

function writeEvents(logDir: string, body: string): void {
  for (const line of body.trim().split("\n")) {
    try {
      const event = JSON.parse(line);
      if (event.traceId && existsSync(logDir) && /^[\w-]+$/.test(event.traceId))
        appendFileSync(join(logDir, `${event.traceId}.ndjson`), `${line}\n`);
    } catch {}
  }
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function createTraceServer(logDir: string): TraceServer {
  let httpServer: Server | null = null;

  async function handleRequest(req: IncomingMessage, res: ServerResponse) {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/traces") {
      const body = await collectBody(req);
      writeEvents(logDir, body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
      return;
    }

    res.writeHead(404);
    res.end();
  }

  return {
    start(port: number): Promise<number> {
      return new Promise((resolve, reject) => {
        httpServer = createServer((req, res) => {
          handleRequest(req, res);
        });
        httpServer.listen(port, "127.0.0.1", () => {
          const addr = httpServer?.address();
          resolve(typeof addr === "object" && addr ? addr.port : port);
        });
        httpServer.on("error", reject);
      });
    },

    stop(): Promise<void> {
      return new Promise((resolve) => {
        if (httpServer) httpServer.close(() => resolve());
        else resolve();
      });
    },
  };
}
