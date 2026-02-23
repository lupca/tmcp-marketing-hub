import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { clearCollections } from './mocks/pocketbase';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
    clearCollections();
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
import { mockAuthContext, mockWorkspaceContext } from './mocks/contexts';

// Mock PocketBase
vi.mock('../lib/pocketbase', async () => {
    const mock = await import('./mocks/pocketbase');
    return {
        default: mock.pb,
        pb: mock.pb
    };
});

// We do NOT mock Contexts here anymore.
// We will use real Providers in utils.tsx to get coverage.
