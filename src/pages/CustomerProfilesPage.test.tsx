import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils';
import CustomerProfilesPage from './CustomerProfilesPage';
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

describe('CustomerProfilesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Return dummy workspace for context init
        pb.collection('workspaces').getList.mockResolvedValue({ items: [{ id: 'ws-1', name: 'Test WS' }] });
    });

    it('fetches and displays profiles', async () => {
        const mockItems = [
            { id: '1', name: 'Regular Joe', created: '2023-01-01' }
        ];

        pb.collection('customer_personas').getList.mockResolvedValue({ items: mockItems });
        pb.collection('brand_identities').getFullList.mockResolvedValue([]);

        render(<CustomerProfilesPage />);

        await waitFor(() => {
            expect(screen.getByText('Regular Joe')).toBeInTheDocument();
        });
    });

    it('opens create modal', async () => {
        pb.collection('customer_personas').getList.mockResolvedValue({ items: [] });
        pb.collection('brand_identities').getFullList.mockResolvedValue([]);

        render(<CustomerProfilesPage />);
        await waitFor(() => expect(pb.collection).toHaveBeenCalledWith('workspaces'));

        const createBtn = screen.getByText('New Persona');
        fireEvent.click(createBtn);

        expect(screen.getByText('New Customer Profile', { selector: 'h2' })).toBeInTheDocument();
    });
});
