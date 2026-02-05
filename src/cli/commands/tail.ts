// src/cli/commands/tail.ts
import { watch, readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TraceSummary, TraceEvent } from '../../types.ts'

function summarizeFile(filePath: string): TraceSummary | null {
  try {
    const content = readFileSync(filePath, 'utf-8').trim()
    if (!content) return null
    const events: TraceEvent[] = content.split('\n').map((l) => JSON.parse(l))
    const start = events.find((e) => e.type === 'trace:start')
    if (!start) return null
    const end = events.find((e) => e.type === 'trace:end')
    return {
      id: start.id as string, name: start.name as string,
      status: end ? (end.status as 'ok' | 'error') : 'in_progress',
      duration: end ? (end.duration as number) : undefined,
      spans: events.filter((e) => e.type === 'span:start').length,
      ts: start.ts,
      error: end?.error ? (end.error as any).message : undefined,
    }
  } catch { return null }
}

export async function runTail(options: Record<string, string | boolean>) {
  const logDir = join(process.cwd(), '.trace-ai-logs')
  if (!existsSync(logDir)) { console.log('No active session.'); return }

  console.log('Watching for traces... (Ctrl+C to stop)')
  const seen = new Set(readdirSync(logDir).filter((f) => f.endsWith('.ndjson')))

  watch(logDir, (_event, filename) => {
    if (!filename || !filename.endsWith('.ndjson')) return
    const summary = summarizeFile(join(logDir, filename))
    if (!summary) return
    if (options.errors === true && summary.status !== 'error') return
    if (typeof options.name === 'string') {
      const re = new RegExp('^' + options.name.replace(/\*/g, '.*') + '$')
      if (!re.test(summary.name)) return
    }
    if (summary.status !== 'in_progress' || !seen.has(filename)) {
      seen.add(filename)
      console.log(JSON.stringify(summary))
    }
  })

  await new Promise(() => {})
}
