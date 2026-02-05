// src/cli/parse-args.ts
export interface CliArgs {
  command: string
  id?: string
  options: Record<string, string | boolean>
}

export function parseCliArgs(argv: string[]): CliArgs {
  const command = argv[0] || 'help'
  const options: Record<string, string | boolean> = {}
  let id: string | undefined
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { options[key] = next; i++ }
      else options[key] = true
    } else if (!id) { id = arg }
  }
  return { command, id, options }
}
