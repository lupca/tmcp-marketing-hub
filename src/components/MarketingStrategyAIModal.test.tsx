
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketingStrategyAIModal from './MarketingStrategyAIModal';
import { generateMarketingStrategy } from '../lib/marketingStrategyApi';
import React from 'react';

// Mock API
vi.mock('../lib/marketingStrategyApi', () => ({
    generateMarketingStrategy: vi.fn(),
}));

// Mock props
const mockWorksheets = [{ id: 'w1', title: 'Worksheet A' }];
const mockBrands = [{ id: 'b1', brand_name: 'Brand A' }];
const mockICPs = [{ id: 'p1', persona_name: 'Persona A' }];

describe('MarketingStrategyAIModal', () => {
    let onCloseMock: any;
    let onCompleteMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        onCloseMock = vi.fn();
        onCompleteMock = vi.fn();
    });

    it('renders config form initially', () => {
        render(<MarketingStrategyAIModal worksheets={mockWorksheets as any} brandIdentities={mockBrands as any} customerProfiles={mockICPs as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        expect(screen.getByText('Generate Marketing Strategy with AI')).toBeInTheDocument();
        const generateBtn = screen.getByText('Generate').closest('button');
        expect(generateBtn).toBeDisabled();
    });

    it('enables generate button when all fields selected', async () => {
        render(<MarketingStrategyAIModal worksheets={mockWorksheets as any} brandIdentities={mockBrands as any} customerProfiles={mockICPs as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'b1' } });
        fireEvent.change(selects[2], { target: { value: 'p1' } });

        await waitFor(() => {
            const generateBtn = screen.getByText('Generate').closest('button');
            expect(generateBtn).not.toBeDisabled();
        });
    });

    it('calls API and streams content on generate', async () => {
        render(<MarketingStrategyAIModal worksheets={mockWorksheets as any} brandIdentities={mockBrands as any} customerProfiles={mockICPs as any} onComplete={onCompleteMock} onClose={onCloseMock} />);

        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'b1' } });
        fireEvent.change(selects[2], { target: { value: 'p1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateMarketingStrategy as any).mockImplementation((params, onEvent, signal) => {
            setTimeout(() => {
                onEvent({ type: 'status', status: 'analyzing' });
            }, 10);
            setTimeout(() => {
                onEvent({ type: 'chunk', content: 'Strategy...' });
            }, 30);
            setTimeout(() => {
                onEvent({ type: 'done', marketingStrategy: { positioning: 'Top' } });
                resolveMock();
            }, 50);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText(/Synthesizing Strategy/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Positioning/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Top/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Use This Data'));
        expect(onCompleteMock).toHaveBeenCalled();
    });

    it('displays error message on failure', async () => {
        render(<MarketingStrategyAIModal worksheets={mockWorksheets as any} brandIdentities={mockBrands as any} customerProfiles={mockICPs as any} onComplete={onCompleteMock} onClose={onCloseMock} />);
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'b1' } });
        fireEvent.change(selects[2], { target: { value: 'p1' } });

        let resolveMock: any;
        const mockPromise = new Promise(resolve => { resolveMock = resolve; });

        (generateMarketingStrategy as any).mockImplementation((params, onEvent) => {
            setTimeout(() => {
                onEvent({ type: 'error', error: 'Strategy Failed' });
                resolveMock();
            }, 10);
            return mockPromise;
        });

        fireEvent.click(screen.getByText('Generate'));

        await waitFor(() => {
            expect(screen.getByText('Strategy Failed')).toBeInTheDocument();
        });
    });
});
