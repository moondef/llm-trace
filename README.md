# llm-trace

LLMs can read your code but they can't run it in their head. When something breaks, they end up asking you to paste errors and add `console.log` statements one at a time while they guess at what's going on.

llm-trace fixes this. It gives LLMs a way to instrument your code with structured traces, see actual runtime values, and figure out what went wrong without the back-and-forth.

## Try It

```bash
npm install llm-trace
```

Add the [debugging skill](skills/debugging-with-llm-trace/SKILL.md) to Claude Code (or any LLM coding tool) and ask it to debug something. That's it — the skill teaches it the workflow.

### What happens next

You tell the LLM "this endpoint returns 500 sometimes" and it:

1. Runs `npx llm-trace start`
2. Wraps the endpoint in `trace()` with `span()` and `checkpoint()` calls
3. Triggers the bug
4. Reads the trace — sees actual values at each step, which span failed, the error
5. Fixes the root cause based on what it saw
6. Removes instrumentation, runs `npx llm-trace stop`

## Three Primitives

```typescript
import { trace } from "llm-trace";

await trace("checkout", async (handle) => {

  // span — time a step, nest arbitrarily
  await handle.span("load-cart", async (h) => {
    const cart = await db.getCart(userId);

    // checkpoint — snapshot runtime values
    h.checkpoint("cart", cart);

    return cart;
  });
});
```

**`trace(name, fn)`** — wraps a complete operation. Captures start, end, duration, errors.

**`handle.span(name, fn)`** — a timed step within a trace. Nests to any depth.

**`handle.checkpoint(name, data?)`** — snapshots a value (truncated at 64KB).

Errors are captured automatically — if anything throws, the trace records the error and stack.

## CLI

```bash
llm-trace start             # begin session
llm-trace list              # all traces (JSON by default)
llm-trace list --errors     # just failures
llm-trace show <id>         # full trace tree
llm-trace tail              # watch live
llm-trace stop              # end session, delete traces
```

Output is JSON by default (for LLM consumption). Add `--human` for readable output.

## How It Fits Together

The LLM writes `trace()` / `span()` / `checkpoint()` calls into your code. When the code runs, events stream over HTTP to a local server that writes `.ndjson` files. The LLM reads those files via the CLI. After debugging, everything is cleaned up — traces are ephemeral.

No dependencies. No config. Nothing persisted after `stop`.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_TRACE_PORT` | `13579` | HTTP server port |
