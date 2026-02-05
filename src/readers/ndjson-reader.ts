// src/readers/ndjson-reader.ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TraceSummary, TraceTreeNode, TraceEvent, ListOptions } from '../types.ts'
import { buildTree } from './tree-builder.ts'

export function createNdjsonReader(logDir: string) {
  function parseFile(filePath: string): TraceEvent[] {
    const content = readFileSync(filePath, 'utf-8').trim()
    if (!content) return []
    return content.split('\n').map((line: string) => JSON.parse(line))
  }

  function summarize(events: TraceEvent[]): TraceSummary | null {
    const start = events.find((e) => e.type === 'trace:start')
    if (!start) return null
    const end = events.find((e) => e.type === 'trace:end')
    return {
      id: start.id as string,
      name: start.name as string,
      status: end ? (end.status as 'ok' | 'error') : 'in_progress',
      duration: end ? (end.duration as number) : undefined,
      spans: events.filter((e) => e.type === 'span:start').length,
      ts: start.ts,
      error: end?.error ? (end.error as any).message : undefined,
    }
  }

  return {
    async listTraces(options?: ListOptions): Promise<TraceSummary[]> {
      const files = readdirSync(logDir).filter((f: string) => f.endsWith('.ndjson'))
      let summaries: TraceSummary[] = []
      for (const file of files) {
        const s = summarize(parseFile(join(logDir, file)))
        if (s) summaries.push(s)
      }
      summaries.sort((a, b) => b.ts - a.ts)
      if (options?.errors) summaries = summaries.filter((s) => s.status === 'error')
      if (options?.name) {
        const re = new RegExp('^' + options.name.replace(/\*/g, '.*') + '$')
        summaries = summaries.filter((s) => re.test(s.name))
      }
      if (options?.last) summaries = summaries.slice(0, options.last)
      return summaries
    },

    async readTrace(id: string): Promise<TraceTreeNode> {
      return buildTree(parseFile(join(logDir, `${id}.ndjson`)))
    },
  }
}
