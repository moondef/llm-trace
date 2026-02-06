# llm-trace

[![npm version](https://img.shields.io/npm/v/llm-trace.svg)](https://www.npmjs.com/package/llm-trace)
[![CI](https://github.com/moondef/llm-trace/actions/workflows/ci.yml/badge.svg)](https://github.com/moondef/llm-trace/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LLMs can read your code but they can't run it in their head. When something breaks, they end up asking you to paste errors and add `console.log` statements one at a time while they guess at what's going on.

llm-trace fixes this. It gives LLMs a way to instrument your code with structured traces, see actual runtime values, and figure out what went wrong without the back-and-forth.

## Install

Install the [debugging skill](skills/debugging-with-llm-trace/SKILL.md) so your LLM tool knows how to use llm-trace. The skill will ask to `npm install llm-trace` into your project — it's the SDK that provides the `trace()`, `span()`, and `checkpoint()` calls for code instrumentation.

**Claude Code:**
```bash
/plugin install moondef/llm-trace
```

**Codex:**
```
$skill-installer install https://github.com/moondef/llm-trace/tree/main/skills/debugging-with-llm-trace
```

**Any tool** (via npx):
```bash
npx skills add moondef/llm-trace
```

**Or clone and copy manually:**
```bash
git clone https://github.com/moondef/llm-trace.git
cp -r llm-trace/skills/debugging-with-llm-trace ~/.claude/skills/
```

## Usage

Just ask your LLM to debug something. The skill handles the rest.

You say "this endpoint returns 500 sometimes" and it:

1. Starts a tracing session (`llm-trace start`)
2. Instruments the suspect code with `trace()`, `span()`, and `checkpoint()`
3. Runs the code to trigger the bug
4. Reads the trace — actual values at each step, which span failed, the error
5. Fixes the root cause based on what it saw
6. Cleans up instrumentation and stops the session

## What It Captures

Three primitives, all the LLM needs:

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

**`handle.checkpoint(name, data?)`** — snapshots a value at a point in time (truncated at 64KB).

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

## How It Works

The LLM writes `trace()` / `span()` / `checkpoint()` calls into your code. When the code runs, events stream over HTTP to a local server that writes `.ndjson` files. The LLM reads those files via the CLI. After debugging, everything gets cleaned up — traces are ephemeral.

No dependencies. No config. Nothing persisted after `stop`.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_TRACE_PORT` | `13579` | HTTP server port |

## Contributing

Issues and PRs welcome at [github.com/moondef/llm-trace](https://github.com/moondef/llm-trace).
