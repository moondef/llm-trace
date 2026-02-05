// src/cli/formatter.ts
import type { TraceSummary, TraceTreeNode } from '../types.ts'

export function formatTraceList(traces: TraceSummary[], human: boolean): string {
  if (!human) return JSON.stringify(traces, null, 2)
  if (traces.length === 0) return 'No traces found.'
  const header = 'ID                       NAME             STATUS   DURATION  SPANS'
  const rows = traces.map((t) => {
    const dur = t.duration !== undefined ? `${t.duration}ms` : '—'
    return `${t.id.padEnd(24)} ${t.name.padEnd(16)} ${(t.status === 'error' ? 'ERROR' : t.status).padEnd(8)} ${dur.padEnd(9)} ${t.spans}`
  })
  return [header, '-'.repeat(header.length), ...rows].join('\n')
}

export function formatTraceTree(tree: TraceTreeNode, human: boolean): string {
  if (!human) return JSON.stringify(tree, null, 2)
  const lines: string[] = []
  function walk(node: TraceTreeNode, indent: number) {
    const pad = '  '.repeat(indent)
    const status = node.status ? ` [${node.status}]` : ''
    const dur = node.duration !== undefined ? ` ${node.duration}ms` : ''
    const data = node.data ? ` ${JSON.stringify(node.data)}` : ''
    lines.push(`${pad}${node.type}: ${node.name}${status}${dur}${data}`)
    for (const child of node.children) walk(child, indent + 1)
  }
  walk(tree, 0)
  return lines.join('\n')
}
