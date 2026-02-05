import { appendFileSync, existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";

export function createTraceServer(logDir: string) {
  let httpServer: Server | null = null;

  return {
    start(port: number): Promise<number> {
      return new Promise((resolve, reject) => {
        httpServer = createServer((req, res) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }

          if (req.method === "POST" && req.url === "/traces") {
            let body = "";
            req.on("data", (c) => {
              body += c;
            });
            req.on("end", () => {
              for (const line of body.trim().split("\n")) {
                try {
                  const event = JSON.parse(line);
                  if (event.traceId && existsSync(logDir) && /^[\w-]+$/.test(event.traceId))
                    appendFileSync(join(logDir, `${event.traceId}.ndjson`), `${line}\n`);
                } catch {}
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end('{"ok":true}');
            });
            return;
          }

          res.writeHead(404);
          res.end();
        });

        httpServer.listen(port, "127.0.0.1", () => {
          const addr = httpServer?.address();
          resolve(typeof addr === "object" && addr ? addr.port : port);
        });
        httpServer.on("error", reject);
      });
    },

    stop(): Promise<void> {
      return new Promise((r) => {
        if (httpServer) httpServer.close(() => r());
        else r();
      });
    },
  };
}
