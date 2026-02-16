
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentChat from './AgentChat';
import React from 'react';

// Mock chatApi
vi.mock('../lib/chatApi', () => ({
    sendMessage: vi.fn(),
    checkHealth: vi.fn().mockResolvedValue(true),
}));

import { sendMessage, checkHealth } from '../lib/chatApi';

describe('AgentChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since AgentChat calls checkHealth on mount, we need to ensure the mock is ready
        (checkHealth as any).mockResolvedValue(true);
        // JSDOM doesn't implement scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    it('renders FAB initially', () => {
        render(<AgentChat />);
        expect(screen.getByRole('button', { name: /Chat with Agents/i })).toBeInTheDocument();
    });

    it('opens chat window on FAB click', () => {
        render(<AgentChat />);
        fireEvent.click(screen.getByRole('button', { name: /Chat with Agents/i }));
        expect(screen.getByText('Marketing Agents')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('displays health status', async () => {
        render(<AgentChat />);
        fireEvent.click(screen.getByRole('button', { name: /Chat with Agents/i }));

        await waitFor(() => {
            expect(screen.getByText('System Online')).toBeInTheDocument();
        });
    });

    it('sends message on enter or button click', async () => {
        render(<AgentChat />);
        fireEvent.click(screen.getByRole('button', { name: /Chat with Agents/i }));

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hello AI' } });

        // Mock stream response
        (sendMessage as any).mockImplementation((text, threadId, onEvent, signal) => {
            // Simulate events
            setTimeout(() => {
                onEvent({ type: 'status', status: 'thinking', agent: 'Supervisor' });
                onEvent({ type: 'chunk', content: 'Hi there!' });
                onEvent({ type: 'done' });
            }, 10);
            return Promise.resolve();
        });

        fireEvent.click(screen.getByTitle('Send'));

        expect(input).toHaveValue(''); // Should clear input
        expect(screen.getByText('Hello AI')).toBeInTheDocument(); // User message

        // Wait for agent response
        await waitFor(() => {
            expect(screen.getByText('Hi there!')).toBeInTheDocument();
        });

        expect(sendMessage).toHaveBeenCalledWith('Hello AI', expect.any(String), expect.any(Function), expect.any(AbortSignal));
    });

    it('handles tool execution logs', async () => {
        render(<AgentChat />);
        fireEvent.click(screen.getByRole('button', { name: /Chat with Agents/i }));

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Do something' } });

        (sendMessage as any).mockImplementation((text, thread, onEvent) => {
            setTimeout(() => {
                onEvent({ type: 'tool_start', tool: 'search_web', input: { query: 'test' } });
                onEvent({ type: 'tool_end', tool: 'search_web', output: 'results' });
                onEvent({ type: 'done' });
            }, 10);
            return Promise.resolve();
        });

        fireEvent.click(screen.getByTitle('Send'));

        await waitFor(() => {
            expect(screen.getByText('1 tool used')).toBeInTheDocument();
        });

        // Expand tools
        fireEvent.click(screen.getByText('1 tool used'));
        expect(screen.getByText('search_web')).toBeInTheDocument();
        expect(screen.getByText('results')).toBeInTheDocument();
    });

    it('displays error message', async () => {
        render(<AgentChat />);
        fireEvent.click(screen.getByRole('button', { name: /Chat with Agents/i }));

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Error trigger' } });

        (sendMessage as any).mockRejectedValue(new Error('Network Error'));

        fireEvent.click(screen.getByTitle('Send'));

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeInTheDocument();
        });
    });
});
