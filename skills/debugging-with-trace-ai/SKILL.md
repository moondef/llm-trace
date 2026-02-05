---
name: debugging-with-trace-ai
description: Use when debugging runtime issues, unexpected behavior, or errors in code that has trace-ai installed — before resorting to print statements or guessing at fixes
---

# Debugging with trace-ai

## Overview

You can see runtime behavior directly instead of asking the user to paste errors. Instrument the code, run it, read the traces, find root cause.

**Core principle:** Instrument first, read traces, then fix. Never guess at runtime behavior.

## When to Use

- Bug reports where you can't see what happened at runtime
- Unexpected behavior that isn't obvious from reading code
- Errors deep in async call chains
- Performance issues where you need to see what's slow
- Any time you'd normally ask "can you paste the error?"

**Don't use when:**
- Bug is obvious from reading the code (typo, wrong variable name)
- Issue is purely at the type level (compile error, not runtime)

## Prerequisites

Confirm trace-ai is installed:

```bash
# Check if installed
npm ls trace-ai

# Install if needed
npm install trace-ai
```

## The Process

### 1. Start a session

```bash
npx trace-ai start
```

Check if one is already running:

```bash
npx trace-ai status
```

### 2. Instrument the suspected code

Add `trace()` around the operation that fails. Add `span()` around each step. Add `checkpoint()` to capture state at key decision points.

```typescript
import { trace } from "trace-ai";

// Wrap the failing operation
const result = await trace("debug-checkout", async (handle) => {

  const cart = await handle.span("load-cart", async (h) => {
    const data = await db.getCart(userId);
    h.checkpoint("cart-data", data);         // What does the cart look like?
    return data;
  });

  const total = await handle.span("calculate-total", async (h) => {
    h.checkpoint("input", { cart, discountCode });  // What goes in?
    const result = calculateTotal(cart, discountCode);
    h.checkpoint("output", result);                  // What comes out?
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

**What to instrument:**
- The boundary of the failing operation → `trace()`
- Each logical step within it → `span()`
- Inputs and outputs at decision points → `checkpoint()`
- Data right before the error occurs → `checkpoint()`

**Instrumentation rules:**
- Checkpoint BEFORE and AFTER transforms — see what goes in and what comes out
- Name checkpoints by what the data IS ("cart-data", "api-response"), not what you're doing ("step-1")
- Errors are captured automatically — if a span throws, trace-ai records the error and stack trace

### 3. Run the code

Ask the user to reproduce the issue, or run it yourself if possible:

```bash
# Run the code that triggers the bug
npm test
# or
node scripts/reproduce.js
```

### 4. Read the traces

```bash
# List all traces
npx trace-ai list

# Or filter for just errors
npx trace-ai list --errors

# Show a specific trace as a tree
npx trace-ai show <trace-id>
```

The JSON output gives you:
- **Hierarchy**: trace → spans → checkpoints, showing execution flow
- **Timing**: duration of each span in milliseconds
- **Status**: which span errored and the error message + stack
- **Data**: checkpoint snapshots showing actual runtime values

### 5. Diagnose from the data

Read the trace. The root cause is in the data:
- Which span errored? Read the error message and stack.
- What were the checkpoint values right before the error? Compare expected vs actual.
- Did a value become `null` or `undefined` unexpectedly? Trace it back through checkpoints.
- Is a span taking too long? Compare durations.

### 6. Fix and verify

Fix the root cause. Run again. Check the new trace confirms the fix:

```bash
# Re-run the code
npm test

# Verify the trace is now clean
npx trace-ai list --last 1
npx trace-ai show <new-trace-id>
```

### 7. Clean up

Remove instrumentation and stop the session:

1. Remove the `trace()`, `span()`, and `checkpoint()` calls you added
2. Remove the `import { trace } from "trace-ai"` if no longer needed
3. Stop the session:

```bash
npx trace-ai stop
```

## Narrowing Down

If the first trace is too broad, narrow the instrumentation:

1. Find which span errors or has unexpected checkpoint values
2. Replace that span's body with more granular spans and checkpoints
3. Run again
4. Repeat until you see the exact line/value causing the issue

This is binary search for bugs — each iteration halves the search space.

## Quick Reference

| Primitive | When to use | What it captures |
|-----------|-------------|-----------------|
| `trace(name, fn)` | Whole operation boundary | Start/end, duration, error |
| `handle.span(name, fn)` | Each step within a trace | Start/end, duration, error |
| `handle.checkpoint(name, data?)` | Key decision points | Point-in-time data snapshot |

| CLI Command | Purpose |
|-------------|---------|
| `trace-ai start` | Begin session |
| `trace-ai list --errors` | Find failing traces |
| `trace-ai show <id>` | Read full trace tree |
| `trace-ai tail` | Watch for new traces live |
| `trace-ai stop` | End session, delete traces |

## Common Mistakes

**Instrumenting too much at once**
Start with one trace around the failing operation. Add granularity only where the trace shows the problem is.

**Forgetting to checkpoint before transforms**
If you only checkpoint the output, you can't tell whether the input was bad or the transform was bad. Checkpoint both.

**Leaving instrumentation in production code**
Always remove trace-ai calls after debugging. They're for debugging sessions, not permanent logging.

**Not reading the actual trace data**
Don't just look at the error message. Read the checkpoint values. The root cause is usually in the data, not the error string.
