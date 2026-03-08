## 2024-03-24 - [Avoid multiple nested map/reduce on lists]
 **Learning:** [Running `.filter` multiple times within `.reduce` for UI categories triggers O(N*M) time complexity. Doing it inside the render function recalculates this on every frame update, tanking performance.]
 **Action:** [Combine grouping and search filtering into a single loop using `useMemo` so complexity becomes O(N) and result is cached.]
