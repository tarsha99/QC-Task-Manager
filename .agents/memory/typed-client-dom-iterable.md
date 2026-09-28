---
name: Generated client DOM iterable types
description: The generated API client uses Headers.entries(), so its composite TypeScript lib must include dom.iterable.
---

The shared generated API client requires `dom.iterable` in its TypeScript `lib` settings because Orval emits code that calls `Headers.entries()`.

**Why:** The default client library settings can typecheck most generated code but fail on this browser API after code generation.

**How to apply:** If generated client typechecking reports that `Headers.entries` does not exist, add `dom.iterable` to the client library package's `compilerOptions.lib` rather than editing generated output.