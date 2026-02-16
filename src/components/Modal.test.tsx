import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils';
import Modal from './Modal';

describe('Modal Component', () => {
    it('renders correctly when open', async () => {
        const onClose = vi.fn();
        render(
            <Modal title="Test Modal" onClose={onClose}>
                <p>Modal Content</p>
            </Modal>
        );

        // Wait for context loading (AuthProvider/WorkspaceProvider)
        await waitFor(() => {
            expect(screen.getByText('Test Modal')).toBeInTheDocument();
            expect(screen.getByText('Modal Content')).toBeInTheDocument();
        });
    });

    it('calls onClose when close button is clicked', async () => {
        const onClose = vi.fn();
        render(
            <Modal title="Test Modal" onClose={onClose}>
                <p>Modal Content</p>
            </Modal>
        );

        await waitFor(() => expect(screen.getByText('Test Modal')).toBeInTheDocument());

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
