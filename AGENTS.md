# AGENTS.md

## What is llm-trace

A zero-dependency debugging tool that gives LLMs direct visibility into runtime behavior. Instead of asking users to paste errors, LLMs instrument code with traces, run it, and read structured execution data. Read `docs/spec.md` for the full product spec.

## Debugging Skill

`skills/debugging-with-llm-trace/SKILL.md` — importable skill for Claude Code, Codex, and other LLM tools. Teaches LLMs the full debugging workflow: instrument, run, read traces, fix.

## Design Principles

- **Zero dependencies** — only Node.js built-ins. No runtime deps.
- **LLM-first** — the LLM does the instrumenting and querying, not the developer.
- **Explicit over magic** — handle-based context, no AsyncLocalStorage, no globals.
- **DI via factories** — `createTracer({ writer, idGenerator, clock })`. All factories return named interfaces.
- **Discriminated unions** — `TraceEvent` is a union of typed interfaces. `switch(event.type)` to narrow. No `as` casts.
- **Ephemeral data** — traces live only during a debugging session. No persistence.

## Commands

```bash
npm run build       # tsdown → dist/ (ESM + CJS + .d.ts)
npm run typecheck   # tsc --noEmit
npm run lint        # biome check src/
npm test            # node:test with --experimental-strip-types
```

## Conventions

- All types live in `src/types.ts`
- Tests colocated: `foo.ts` → `foo.test.ts`
- No `as` casts — discriminated unions and type predicates
- Factory functions return named interfaces, not inferred types
- Test writers use `any[]` to avoid coupling to event type details
