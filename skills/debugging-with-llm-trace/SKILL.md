---
name: debugging-with-llm-trace
description: Use when debugging runtime issues, unexpected behavior, errors, or performance problems. Covers instrumenting code with trace/span/checkpoint, reading structured execution traces, diagnosing root cause from runtime data, iterative narrowing, and verifying fixes. Use before resorting to print statements or guessing at fixes. Requires llm-trace to be installed in the project.
---

# Debugging with llm-trace

## Overview

You can see runtime behavior directly instead of asking the user to paste errors. Instrument the code, run it, read the traces, find root cause.

## Guardrails

```
NEVER guess at runtime behavior. Instrument first, read traces, then fix.
NEVER propose fixes before reading trace data.
NEVER leave instrumentation in the code after debugging.
```

## Prerequisites (required)

Verify llm-trace is available before proceeding:

```bash
npm ls llm-trace || npm install llm-trace
```

If this fails, stop and resolve the installation before continuing.

## The Process

### 1. Start a session

```bash
npx llm-trace start
```

Check if one is already running:

```bash
npx llm-trace status
```

### 2. Instrument the suspected code

Add `trace()` around the operation that fails. Add `span()` around each step. Add `checkpoint()` to capture state at key points.

```typescript
import { trace } from "llm-trace";

const result = await trace("debug-checkout", async (handle) => {

  const cart = await handle.span("load-cart", async (h) => {
    const data = await db.getCart(userId);
    h.checkpoint("cart-data", data);
    return data;
  });

  const total = await handle.span("calculate-total", async (h) => {
    h.checkpoint("input", { cart, discountCode });
    const result = calculateTotal(cart, discountCode);
    h.checkpoint("output", result);
    return result;
  });

  return await handle.span("charge-payment", async (h) => {
    h.checkpoint("charge-request", { total, paymentMethod });
    const charge = await payments.charge(total, paymentMethod);
    h.checkpoint("charge-result", charge);
    return charge;
  });
});
```

**Rules:**
- Checkpoint BEFORE and AFTER transforms — see what goes in and what comes out
- Name checkpoints by what the data IS ("cart-data", "api-response"), not what you're doing ("step-1")
- Errors are captured automatically — if a span throws, llm-trace records the error and stack

### 3. Run the code

Trigger the bug — run whatever reproduces the issue. Ask the user if you're not sure how.

Do NOT modify any code during this step. Only observe.

### 4. Read the traces

```bash
npx llm-trace list              # all traces
npx llm-trace list --errors     # just failures
npx llm-trace show <trace-id>   # full trace tree
```

#### `list` output

```json
[{
  "id": "debug-checkout-a1b2c3",
  "name": "debug-checkout",
  "status": "error",
  "duration": 523,
  "spans": 3,
  "ts": 1738800000000,
  "error": "Payment failed: card declined"
}]
```

#### `show` output

Nested tree of spans and checkpoints:

```json
{
  "type": "trace", "name": "debug-checkout", "status": "error", "duration": 523,
  "children": [
    { "type": "span", "name": "load-cart", "status": "ok", "duration": 45,
      "children": [
        { "type": "checkpoint", "name": "cart-data",
          "data": { "items": [{ "sku": "A1", "qty": 2, "price": 29.99 }] } }
      ] },
    { "type": "span", "name": "calculate-total", "status": "ok", "duration": 3,
      "children": [
        { "type": "checkpoint", "name": "input",
          "data": { "discountCode": "SAVE10" } },
        { "type": "checkpoint", "name": "output",
          "data": { "subtotal": 59.98, "discount": -6.0, "total": -53.98 } }
      ] },
    { "type": "span", "name": "charge-payment", "status": "error", "duration": 475,
      "error": { "message": "Payment failed: card declined" },
      "children": [
        { "type": "checkpoint", "name": "charge-request",
          "data": { "total": -53.98 } }
      ] }
  ]
}
```

This trace tells the story: `calculate-total` produced a negative total (`-53.98` — discount subtracted wrong), so `charge-payment` failed. Root cause is in `calculateTotal`, not the payment code.

### 5. Diagnose from the data

Read the trace. The root cause is in the data:
- Which span errored? Read the error message and stack.
- What checkpoint values came right before the error? Compare expected vs actual.
- Did a value become `null` or `undefined` unexpectedly? Trace it back through checkpoints.
- Is a span taking too long? Compare durations.

Do NOT propose fixes until you understand the root cause from the trace data.

### 6. Fix and verify

Fix the root cause. Reproduce the scenario again. Confirm the new trace is clean:

```bash
npx llm-trace list --last 1
npx llm-trace show <new-trace-id>
```

### 7. Clean up

This step is mandatory:

1. Remove all `trace()`, `span()`, and `checkpoint()` calls you added
2. Remove `import { trace } from "llm-trace"` if no longer needed
3. Stop the session:

```bash
npx llm-trace stop
```

## Narrowing Down

If the first trace is too broad:

1. Find which span has unexpected checkpoint values
2. Replace that span's body with more granular spans and checkpoints
3. Run again
4. Repeat until you see the exact value causing the issue

Each iteration halves the search space.

## Quick Reference

| Primitive | Purpose |
|-----------|---------|
| `trace(name, fn)` | Wrap a complete operation |
| `handle.span(name, fn)` | Time a step within a trace |
| `handle.checkpoint(name, data?)` | Snapshot a value |

| CLI | Purpose |
|-----|---------|
| `llm-trace start` | Begin session |
| `llm-trace list` | List all traces |
| `llm-trace list --errors` | List failures only |
| `llm-trace show <id>` | Full trace tree |
| `llm-trace tail` | Watch live |
| `llm-trace stop` | End session, delete traces |

## Common Mistakes

**Guessing before reading traces.**
The trace data shows you the root cause. Read it before proposing fixes.

**Instrumenting too much at once.**
Start with one trace around the failing operation. Add granularity only where the trace shows the problem is.

**Forgetting to checkpoint before transforms.**
If you only checkpoint the output, you can't tell whether the input was bad or the transform was bad. Checkpoint both.

**Leaving instrumentation in the code.**
Always remove llm-trace calls after debugging. They're for debugging sessions, not permanent logging.
