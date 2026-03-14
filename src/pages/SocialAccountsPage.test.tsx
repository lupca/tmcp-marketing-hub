import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../test/utils';
import pb from '../lib/pocketbase';
import SocialAccountsPage from './SocialAccountsPage';

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

describe('SocialAccountsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and displays social accounts', async () => {
        const mockItems = [
            {
                id: '1',
                platform: 'instagram',
                account_name: 'My Brand IG',
                account_id: 'ig_001',
                expires_at: '2026-12-31 00:00:00.000Z',
            },
        ];

        pb.collection('social_accounts').getList.mockResolvedValue({ items: mockItems });

        render(<SocialAccountsPage />);

        await waitFor(() => {
            expect(screen.getByText('My Brand IG')).toBeInTheDocument();
            expect(screen.getByText('instagram')).toBeInTheDocument();
            expect(screen.getByText('ig_001')).toBeInTheDocument();
        });

        expect(pb.collection('social_accounts').getList).toHaveBeenCalledWith(
            1,
            200,
            expect.objectContaining({
                filter: 'workspace_id = "ws-1"',
            }),
        );

        const callArgs = pb.collection('social_accounts').getList.mock.calls[0]?.[2] || {};
        expect(callArgs.sort).toBeUndefined();
    });

    it('opens create modal', async () => {
        pb.collection('social_accounts').getList.mockResolvedValue({ items: [] });

        render(<SocialAccountsPage />);

        fireEvent.click(screen.getByText('New Account'));

        expect(screen.getByText('New Social Account', { selector: 'h2' })).toBeInTheDocument();
    });

    it('creates a social account', async () => {
        pb.collection('social_accounts').getList.mockResolvedValue({ items: [] });
        pb.collection('social_accounts').create.mockResolvedValue({ id: 'new-id' });

        render(<SocialAccountsPage />);

        fireEvent.click(screen.getByText('New Account'));
        fireEvent.change(screen.getByLabelText('Account Name *'), { target: { value: 'LinkedIn Company' } });
        fireEvent.change(screen.getByLabelText('Account ID *'), { target: { value: 'li_999' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(pb.collection('social_accounts').create).toHaveBeenCalled();
        });
    });

    it('shows delete confirmation', async () => {
        pb.collection('social_accounts').getList.mockResolvedValue({
            items: [
                {
                    id: '1',
                    platform: 'facebook',
                    account_name: 'FB Page',
                    account_id: 'fb_123',
                },
            ],
        });

        render(<SocialAccountsPage />);

        await waitFor(() => {
            expect(screen.getByText('FB Page')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle('Delete'));
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });
});
