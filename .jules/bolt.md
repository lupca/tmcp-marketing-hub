
## 2024-03-14 - [O(N) Search Filter Optimization]
**Learning:** Found multiple instances of O(N) array filtering executing inside the render loop using `.filter()` and inline `.toLowerCase()` transformations on both the search term and array items. This causes redundant string conversions and array iteration on every render, even when the data and search terms haven't changed.
**Action:** Always wrap search and filter operations in `useMemo` with appropriate dependencies, and hoist common operations like `search.toLowerCase()` outside of the `.filter()` callback to avoid unnecessary re-evaluations during re-renders.
