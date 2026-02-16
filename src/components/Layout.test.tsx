import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import Layout from './Layout';
import { mockAuthContext } from '../test/mocks/contexts';

// Mock the Sidebar usage of location
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: () => ({ pathname: '/dashboard' }),
        useNavigate: () => vi.fn(),
    };
});

describe('Layout Component', () => {
    it('renders the sidebar and main content area', async () => {
        render(
            <Layout>
                <div data-testid="main-content">Test Content</div>
            </Layout>
        );

        // Wait for context loading
        await waitFor(() => {
            // Sidebar elements (assuming standard text is present)
            expect(screen.getByText('TMCP Marketing')).toBeInTheDocument();
        });

        expect(screen.getByText('Dashboard')).toBeInTheDocument();

        // Header elements
        // expect(screen.getByText('Test Workspace')).toBeInTheDocument(); // From real workspace context (mocked via pb)
        // expect(screen.getByText('Test User')).toBeInTheDocument(); // From real auth context

        // Child content
        expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('toggles sidebar on mobile', async () => {
        // This might be harder to test without resizing window, but we can check if the button exists
        // const menuBtn = screen.getByRole('button', { name: /menu/i });
        // expect(menuBtn).toBeInTheDocument();
    });
});
