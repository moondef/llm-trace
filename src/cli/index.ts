#!/usr/bin/env node
import { runList } from "./commands/list.ts";
import { runShow } from "./commands/show.ts";
import { runStart } from "./commands/start.ts";
import { runStatus } from "./commands/status.ts";
import { runStop } from "./commands/stop.ts";
import { runTail } from "./commands/tail.ts";
import { parseCliArgs } from "./parse-args.ts";

const HELP = `llm-trace — Structured execution traces for LLM debugging

Usage:
  llm-trace start              Begin debugging session
  llm-trace stop               End session, delete traces
  llm-trace status             Show session info
  llm-trace list [--errors] [--name <pattern>] [--last <n>] [--human]
  llm-trace show <id> [--human]
  llm-trace tail [--errors] [--name <pattern>]
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
        console.error("Usage: llm-trace show <id>");
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
