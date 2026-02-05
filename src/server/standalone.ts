import { createTraceServer } from "./server.ts";

const port = parseInt(process.env.TRACE_AI_PORT || "13579", 10);
const logDir = process.env.TRACE_AI_DIR || "";
if (!logDir) {
  console.error("TRACE_AI_DIR required");
  process.exit(1);
}

const server = createTraceServer(logDir);
server.start(port);
