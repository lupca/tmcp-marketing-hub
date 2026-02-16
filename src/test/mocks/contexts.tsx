import { vi } from 'vitest';

export const mockAuthContext = {
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
};

export const mockWorkspaceContext = {
    workspaces: [{ id: 'ws-1', name: 'Test Workspace', created: '', updated: '' }],
    currentWorkspace: { id: 'ws-1', name: 'Test Workspace', created: '', updated: '' },
    loading: false,
    createWorkspace: vi.fn(),
    switchWorkspace: vi.fn(),
    refreshWorkspaces: vi.fn(),
};

// Mock modules
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../contexts/WorkspaceContext', () => ({
    useWorkspace: () => mockWorkspaceContext,
    WorkspaceProvider: ({ children }: any) => <div>{children}</div>
}));
