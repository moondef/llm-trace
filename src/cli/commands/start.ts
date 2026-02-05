import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export async function startSession(projectDir: string, options: { skipServer?: boolean } = {}) {
  const logDir = join(projectDir, '.trace-ai-logs')
  if (existsSync(logDir)) return { created: false, alreadyActive: true }
  mkdirSync(logDir, { recursive: true })

  const gi = join(projectDir, '.gitignore')
  if (existsSync(gi)) {
    if (!readFileSync(gi, 'utf-8').includes('.trace-ai-logs/'))
      appendFileSync(gi, '\n.trace-ai-logs/\n')
  } else {
    writeFileSync(gi, '.trace-ai-logs/\n')
  }

  if (!options.skipServer) {
    const port = parseInt(process.env.TRACE_AI_PORT || '', 10) || 13579
    const script = join(fileURLToPath(import.meta.url), '..', '..', '..', 'server', 'standalone.js')
    const child = spawn(process.execPath, [script], {
      detached: true, stdio: 'ignore',
      env: { ...process.env, TRACE_AI_PORT: String(port), TRACE_AI_DIR: logDir },
    })
    child.unref()
    writeFileSync(join(logDir, '.server'), JSON.stringify({ pid: child.pid, port }))
    return { created: true, port }
  }
  return { created: true }
}

export async function runStart() {
  const r = await startSession(process.cwd())
  if (r.alreadyActive) console.log('Session already active.')
  else console.log(`Session started.${r.port ? ` Browser server on port ${r.port}.` : ''}`)
}
