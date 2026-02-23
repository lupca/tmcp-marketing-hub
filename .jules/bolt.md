## 2025-05-20 - Memoization of Dynamic List Items
**Learning:** In lists where parent components pass dynamically created callbacks (like `() => fn(id)`), wrapping child components in `React.memo` is ineffective unless the callback is also memoized or passed directly. Passing the handler + ID separately or ensuring the handler takes an ID (and passing the stable handler) is crucial for list performance.
**Action:** Always refactor list item callbacks to be stable (e.g., pass `onAction` and `id` to child, or child calls `onAction(id)`) before applying `React.memo`.
