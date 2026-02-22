
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerProfileAIModal from './CustomerProfileAIModal';
import { generateCustomerProfile } from '../lib/customerProfileApi';
import React from 'react';

// Mock API
vi.mock('../lib/customerProfileApi', () => ({
    generateCustomerProfile: vi.fn(),
}));

// Mock props
const mockBrands = [
    { id: 'b1', name: 'Brand A' },
    { id: 'b2', name: 'Brand B' },
];

describe('CustomerProfileAIModal', () => {
    let onCloseMock: any;
    let onCompleteMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        onCloseMock = vi.fn();
        onCompleteMock = vi.fn();
    });

    it('renders config form initially', () => {
        render(<CustomerProfileAIModal brandIdentities={mockBrands as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        expect(screen.getByText('Generate Customer Profile with AI')).toBeInTheDocument();
        const generateBtn = screen.getByText('Generate').closest('button');
        expect(generateBtn).toBeDisabled();
    });

    it('enables generate button when brand is selected', () => {
        render(<CustomerProfileAIModal brandIdentities={mockBrands as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'b1' } });
        const generateBtn = screen.getByText('Generate').closest('button');
        expect(generateBtn).not.toBeDisabled();
    });

    it('calls API and streams content on generate', async () => {
        render(<CustomerProfileAIModal brandIdentities={mockBrands as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'b1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateCustomerProfile as any).mockImplementation((brandId, lang, onEvent) => {
            setTimeout(() => {
                onEvent({ type: 'status', status: 'fetching_brand' });
            }, 10);
            setTimeout(() => {
                onEvent({ type: 'chunk', content: 'Analyzing...' });
            }, 30);
            setTimeout(() => {
                onEvent({ type: 'done', customerProfile: { personaName: 'Persona A', summary: 'Summary' } });
                resolveMock();
            }, 50);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText(/Fetching brand identity data via MCP\.\.\./i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Analyzing.../i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Profile generated!/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Use This Data'));
        expect(onCompleteMock).toHaveBeenCalled();
    });

    it('displays error message on failure', async () => {
        render(<CustomerProfileAIModal brandIdentities={mockBrands as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'b1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateCustomerProfile as any).mockImplementation((brandId, lang, onEvent) => {
            setTimeout(() => {
                onEvent({ type: 'error', error: 'Generation Failed' });
                resolveMock();
            }, 10);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText('Generation Failed')).toBeInTheDocument();
        });
    });
});
