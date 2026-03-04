
## 2024-03-05 - React Context State Closures in async fetches
**Learning:** Found a sneaky bug in `WorkspaceContext.tsx` where an async `fetchWorkspaces` function was calling `selectWorkspace(records[0].id)`. `selectWorkspace` uses the internal `workspaces` state to find the record, which would fail if called immediately after `setWorkspaces` due to stale closures.
**Action:** When updating a Context state and immediately needing to derive from it within an async block, use the local fetched object directly (e.g., `setCurrentWorkspace(records[0])`) instead of relying on a selector function that depends on React's async state updates.
