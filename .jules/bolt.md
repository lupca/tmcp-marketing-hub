## 2024-05-20 - [React Router Layout Persistence]
**Learning:** Using a wrapper component in sibling `element` props (like `<Route element={<Wrapper><Page/></Wrapper>} />`) causes the Wrapper to unmount/remount on navigation because React Router v6 treats them as separate route branches, destroying component state and triggering redundant data fetches (like in WorkspaceProvider).
**Action:** Always use Layout Routes (`<Route element={<Wrapper><Outlet/></Wrapper>}>`) to preserve state and prevent redundant re-renders/fetches across route transitions.
