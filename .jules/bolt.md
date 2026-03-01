## 2024-05-23 - React.memo Fragility
**Learning:** `React.memo` on list items is easily broken if parent components pass unstable props (like inline functions or new object references). In `SocialPostsPage`, the `form` object and `onToggleExpand` callback were causing unnecessary re-renders despite memoization attempts.
**Action:** Always verify referential stability of all props passed to memoized components. Use `useMemo` for constructed objects (like custom hook returns) and `useCallback` for event handlers.
