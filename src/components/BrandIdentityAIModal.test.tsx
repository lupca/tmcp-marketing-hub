
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BrandIdentityAIModal from './BrandIdentityAIModal';
import { generateBrandIdentity } from '../lib/brandIdentityApi';
import React from 'react';

// Mock API
vi.mock('../lib/brandIdentityApi', () => ({
    generateBrandIdentity: vi.fn(),
}));

// Mock props
const mockWorksheets = [
    { id: 'ws1', title: 'Worksheet 1', workspace_id: 'ws_abc', brandRefs: [], customerRefs: [], status: 'draft', created: '', updated: '', collectionId: '', collectionName: '' },
    { id: 'ws2', title: 'Worksheet 2', workspace_id: 'ws_abc', brandRefs: [], customerRefs: [], status: 'draft', created: '', updated: '', collectionId: '', collectionName: '' },
];

describe('BrandIdentityAIModal', () => {
    let onCloseMock: any;
    let onCompleteMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        onCloseMock = vi.fn();
        onCompleteMock = vi.fn();
    });

    it('renders config form initially', () => {
        render(<BrandIdentityAIModal worksheets={mockWorksheets as any} onClose={onCloseMock} onComplete={onCompleteMock} />);
        expect(screen.getByText('✨ Generate Brand Identity with AI')).toBeInTheDocument();
        const generateBtn = screen.getByText('Generate').closest('button');
        expect(generateBtn).toBeDisabled();
    });

    it('enables generate button when worksheet is selected', () => {
        render(<BrandIdentityAIModal worksheets={mockWorksheets as any} onClose={onCloseMock} onComplete={onCompleteMock} />);
        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'ws1' } });
        const generateBtn = screen.getByText('Generate').closest('button');
        expect(generateBtn).not.toBeDisabled();
    });

    it('calls API and streams content on generate', async () => {
        render(<BrandIdentityAIModal worksheets={mockWorksheets as any} onClose={onCloseMock} onComplete={onCompleteMock} />);

        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'ws1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateBrandIdentity as any).mockImplementation((config, onEvent, signal) => {
            setTimeout(() => {
                onEvent({ type: 'status', status: 'thinking' });
            }, 10);
            setTimeout(() => {
                onEvent({ type: 'chunk', content: 'Design System:' });
            }, 30);
            setTimeout(() => {
                onEvent({ type: 'done', brandIdentity: { name: 'New Brand', colorPalette: ['#fff'] } });
                resolveMock();
            }, 50);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText(/Generating brand identity/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Brand identity generated!/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Use This Data'));
        expect(onCompleteMock).toHaveBeenCalledWith({ name: 'New Brand', colorPalette: ['#fff'] });
    });

    it('displays error message on failure', async () => {
        render(<BrandIdentityAIModal worksheets={mockWorksheets as any} onClose={onCloseMock} onComplete={onCompleteMock} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'ws1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateBrandIdentity as any).mockImplementation((config, onEvent) => {
            setTimeout(() => {
                onEvent({ type: 'error', error: 'API Failed' });
                resolveMock();
            }, 10);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText('API Failed')).toBeInTheDocument();
        });
    });

    it('handles cancellation', () => {
        render(<BrandIdentityAIModal worksheets={mockWorksheets as any} onClose={onCloseMock} onComplete={onCompleteMock} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCloseMock).toHaveBeenCalled();
    });
});
