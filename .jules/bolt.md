
## 2024-05-17 - [Optimizing Render Loops with useMemo Hash Maps]
**Learning:** Performing O(N) filtering inside a render loop for a repeating structure (like a 42-cell calendar view) scales extremely poorly as data grows.
**Action:** Always pre-compute a dictionary/hash-map using `useMemo` outside the render loop for O(1) lookups during child rendering. Pre-define empty fallback objects/arrays (`const EMPTY = []`) outside the component to preserve stable React references and prevent unnecessary re-renders when using `useMemo`.
