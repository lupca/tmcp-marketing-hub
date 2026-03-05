
## 2024-03-14 - [ContentBriefsPage Optimization]
**Learning:** In React views rendering data grids with complex grouping (like funnel stages), naive nested iteration (e.g., using `filter` inside `reduce` after another `filter`) leads to O(N*M) performance bottlenecks and frequent garbage collection, especially when `search` state changes trigger re-renders.
**Action:** Always implement a single-pass iteration inside `useMemo` when both filtering items globally and grouping them into categories, to minimize both array passes and memory allocations.
