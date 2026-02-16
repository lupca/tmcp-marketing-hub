import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils';
import WorksheetsPage from './WorksheetsPage';
import { pb } from '../test/mocks/pocketbase';

// Mock the contexts to avoid async loading issues
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

describe('WorksheetsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and displays worksheets', async () => {
        pb.collection('worksheets').getList.mockResolvedValue({
            items: [
                { id: '1', title: 'Test Worksheet', created: '2023-01-01', updated: '2023-01-01', expand: {} }
            ],
            totalItems: 1
        });
        pb.collection('brand_identities').getFullList.mockResolvedValue([]);
        pb.collection('customer_personas').getFullList.mockResolvedValue([]);

        render(<WorksheetsPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Worksheet')).toBeInTheDocument();
        });
    });

    it('opens create modal and saves new worksheet', async () => {
        pb.collection('worksheets').getList.mockResolvedValue({ items: [], totalItems: 0 });
        pb.collection('brand_identities').getFullList.mockResolvedValue([]);
        pb.collection('customer_personas').getFullList.mockResolvedValue([]);
        pb.collection('worksheets').create.mockResolvedValue({ id: 'new-1', title: 'New WS' });

        render(<WorksheetsPage />);

        fireEvent.click(screen.getByText('New Worksheet'));

        await waitFor(() => {
            expect(screen.getByText('New Worksheet', { selector: 'h2' })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Worksheet title...'), { target: { value: 'New WS' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(pb.collection('worksheets').create).toHaveBeenCalledWith(expect.objectContaining({
                title: 'New WS',
                workspace_id: 'ws-1'
            }));
        });
    });
});
