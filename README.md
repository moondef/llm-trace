# trace-ai

When an LLM debugs your code, it can't see what happens at runtime. It reads your source, guesses what went wrong, and asks you to paste error messages. You end up as a middleman — running code, copying output, adding print statements.

trace-ai lets LLMs see runtime behavior directly. They instrument your code with traces, run it, inspect what happened, and fix the bug — without asking you to copy-paste anything.

## Setup

```bash
npm install trace-ai
```

Add the [debugging skill](skills/debugging-with-trace-ai/SKILL.md) to your LLM tool (Claude Code, Codex, etc.) so it knows how to use trace-ai.

## How It Works

1. LLM runs `npx trace-ai start` to begin a debugging session
2. LLM instruments your code with `trace()`, `span()`, and `checkpoint()` calls
3. You run your code (or LLM runs it)
4. LLM queries traces with `npx trace-ai list`, `show`, `tail`
5. LLM reads structured runtime data, identifies root cause, fixes the bug
6. LLM runs `npx trace-ai stop` to clean up

Traces are ephemeral — they exist only during the debugging session and are deleted when it ends.

## API

### `trace(name, fn)` — wrap a complete operation

```typescript
import { trace } from "trace-ai";

const result = await trace("handle-request", async (handle) => {
  // handle.span() and handle.checkpoint() available here
  return processRequest(req);
});
```

### `handle.span(name, fn)` — time a step within a trace

```typescript
await handle.span("call-llm", async (h) => {
  const response = await llm.chat(prompt);
  h.checkpoint("response", response);
  return response;
});
```

### `handle.checkpoint(name, data?)` — snapshot state at a point in time

```typescript
handle.checkpoint("parsed-input", { tokens: 142 });
```

Spans nest arbitrarily. Errors are captured automatically. Checkpoint data is truncated at 64KB.

## CLI

| Command | Description |
|---------|-------------|
| `trace-ai start` | Begin session, start trace server |
| `trace-ai stop` | End session, delete all traces |
| `trace-ai status` | Check if a session is active |
| `trace-ai list` | List traces (`--errors`, `--name <glob>`, `--last <n>`, `--human`) |
| `trace-ai show <id>` | Show trace tree (`--human` for readable output) |
| `trace-ai tail` | Stream new traces (`--errors`, `--name <glob>`) |

Default output is JSON (for LLM consumption). `--human` for readable output.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TRACE_AI_PORT` | `13579` | HTTP server port |
