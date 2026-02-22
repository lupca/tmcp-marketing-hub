import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils';
import BrandIdentitiesPage from './BrandIdentitiesPage';
import { pb } from '../test/mocks/pocketbase';

// Mock the contexts
vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => ({
            user: { id: 'test-user', email: 'test@example.com' },
            isAuthenticated: true,
            isLoading: false,
        }),
    };
});

vi.mock('../contexts/WorkspaceContext', async () => {
    const actual = await vi.importActual('../contexts/WorkspaceContext');
    return {
        ...actual,
        useWorkspace: () => ({
            workspaces: [{ id: 'ws-1', name: 'Test WS' }],
            currentWorkspace: { id: 'ws-1', name: 'Test WS' },
            isLoading: false,
        }),
    };
});

describe('BrandIdentitiesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since we are using REAL WorkspaceContext, we need to ensure it initializes with a workspace.
        // The real WorkspaceContext fetches workspaces from pb.collection('workspaces').

        // Mock workspace fetch for context initialization
        pb.collection('workspaces').getList.mockResolvedValue({ items: [{ id: 'ws-1', name: 'Test WS' }] });
    });

    it('fetches and displays brands', async () => {
        const mockItems = [
            { id: '1', name: 'Acme Corp', created: '2023-01-01' }
        ];

        pb.collection('brand_identities').getList.mockResolvedValue({ items: mockItems });

        render(<BrandIdentitiesPage />);

        await waitFor(() => {
            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        });
    });

    it('opens create modal', async () => {
        pb.collection('brand_identities').getList.mockResolvedValue({ items: [] });

        render(<BrandIdentitiesPage />);
        // Wait for loading to finish (workspace fetch)
        await waitFor(() => expect(pb.collection).toHaveBeenCalledWith('workspaces'));

        const createBtn = screen.getByText('New Brand');
        fireEvent.click(createBtn);

        expect(screen.getByText('New Brand Identity', { selector: 'h2' })).toBeInTheDocument();
    });
});
