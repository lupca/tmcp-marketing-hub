import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils';
import CampaignsPage from './CampaignsPage';
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

describe('CampaignsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and displays campaigns', async () => {
        const mockItems = [
            {
                id: '1',
                name: 'Q1 Launch',
                campaign_name: 'Q1 Launch',
                campaign_type: 'awareness',
                status: 'planned',
                expand: { worksheetId: { title: 'Base Strategy' } },
                kpi_targets: { strategy: { goal: 'Reach 1M' } }
            }
        ];

        pb.collection('marketing_campaigns').getList.mockResolvedValue({ items: mockItems });
        pb.collection('worksheets').getFullList.mockResolvedValue([]);

        render(<CampaignsPage />);

        await waitFor(() => {
            expect(screen.getByText('Q1 Launch')).toBeInTheDocument();
            expect(screen.getByText('Base Strategy')).toBeInTheDocument();
        });
    });

    it('opens create modal', async () => {
        pb.collection('marketing_campaigns').getList.mockResolvedValue({ items: [] });
        pb.collection('worksheets').getFullList.mockResolvedValue([]);

        render(<CampaignsPage />);

        const createBtn = screen.getByText('New Campaign');
        fireEvent.click(createBtn);

        expect(screen.getByText('New Campaign', { selector: 'h2' })).toBeInTheDocument();
    });
});
