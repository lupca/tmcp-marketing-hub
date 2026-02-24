import { render, screen, waitFor } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock contexts to avoid complex setup
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { id: '1', name: 'Test' } }),
}));

vi.mock('./contexts/WorkspaceContext', () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWorkspace: () => ({ workspaces: [], currentWorkspace: { id: '1', name: 'WS' }, selectWorkspace: vi.fn() }),
}));

// Mock pages to speed up test and isolate App routing logic
// We use a default export for the mock because lazy imports the default export
vi.mock('./pages/DashboardPage', () => ({ default: () => <div data-testid="dashboard-page">Dashboard</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div data-testid="login-page">Login</div> }));

test('renders App and navigates to Dashboard via Lazy Loading', async () => {
  render(<App />);

  // It should show Dashboard eventually (since we mocked auth as true)
  // The Suspense fallback might appear briefly, but we wait for the page.
  await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
});
