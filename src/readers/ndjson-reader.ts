import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ListOptions, TraceEvent, TraceReader } from "../types.ts";
import { summarizeEvents } from "./summarize.ts";
import { buildTree } from "./tree-builder.ts";

export function createNdjsonReader(logDir: string): TraceReader {
  function parseFile(filePath: string): TraceEvent[] {
    const content = readFileSync(filePath, "utf-8").trim();
    if (!content) return [];
    return content.split("\n").map((line: string) => JSON.parse(line));
  }

  return {
    async listTraces(options?: ListOptions) {
      const files = readdirSync(logDir).filter((f: string) => f.endsWith(".ndjson"));
      let summaries = [];
      for (const file of files) {
        const s = summarizeEvents(parseFile(join(logDir, file)));
        if (s) summaries.push(s);
      }
      summaries.sort((a, b) => b.ts - a.ts);
      if (options?.errors) summaries = summaries.filter((s) => s.status === "error");
      if (options?.name) {
        const re = new RegExp(`^${options.name.replace(/\*/g, ".*")}$`);
        summaries = summaries.filter((s) => re.test(s.name));
      }
      if (options?.last) summaries = summaries.slice(0, options.last);
      return summaries;
    },

    async readTrace(id: string) {
      return buildTree(parseFile(join(logDir, `${id}.ndjson`)));
    },
  };
}
