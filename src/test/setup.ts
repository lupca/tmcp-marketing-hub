import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock standard resize observer for charts
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

import React from 'react';

// Mock Recharts to avoid JSDOM width/height issues
vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) =>
            React.createElement('div', { className: "recharts-responsive-container", style: { width: 800, height: 800 } }, children),
    };
});

// Global Mocks
import { vi } from 'vitest';
import { mockAuthContext, mockWorkspaceContext } from './mocks/contexts';
import { pb } from './mocks/pocketbase';

// Mock PocketBase
vi.mock('../lib/pocketbase', () => ({
    default: pb,
    pb: pb
}));

// We do NOT mock Contexts here anymore.
// We will use real Providers in utils.tsx to get coverage.
