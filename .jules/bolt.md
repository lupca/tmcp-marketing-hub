## 2024-03-06 - Replacing O(N) inline rendering loops with O(1) Maps
**Learning:** Found a common anti-pattern in React UI rendering logic (e.g. CalendarPage) where `events.filter(...)` was called inside an `.map` loop defining grid cells. This results in an O(N*M) calculation directly on the main thread during render.
**Action:** Always pre-compute a lookup Map in a `useMemo` block first, allowing O(1) lookups during the render loop. This drastically reduces CPU work per-render on heavy list/grid views.
