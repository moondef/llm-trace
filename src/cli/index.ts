#!/usr/bin/env node
import { runList } from "./commands/list.ts";
import { runShow } from "./commands/show.ts";
import { runStart } from "./commands/start.ts";
import { runStatus } from "./commands/status.ts";
import { runStop } from "./commands/stop.ts";
import { runTail } from "./commands/tail.ts";
import { parseCliArgs } from "./parse-args.ts";

const HELP = `trace-ai — Structured execution traces for LLM debugging

Usage:
  trace-ai start              Begin debugging session
  trace-ai stop               End session, delete traces
  trace-ai status             Show session info
  trace-ai list [--errors] [--name <pattern>] [--last <n>] [--human]
  trace-ai show <id> [--human]
  trace-ai tail [--errors] [--name <pattern>]
`;

async function main() {
  const { command, id, options } = parseCliArgs(process.argv.slice(2));
  switch (command) {
    case "start":
      return runStart();
    case "stop":
      return runStop();
    case "status":
      return runStatus();
    case "list":
      return runList(options);
    case "show":
      if (!id) {
        console.error("Usage: trace-ai show <id>");
        process.exit(1);
      }
      return runShow(id, options);
    case "tail":
      return runTail(options);
    default:
      console.log(HELP);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
