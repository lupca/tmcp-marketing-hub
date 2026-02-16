import { vi } from 'vitest';

// Create a stable mock object for collection operations
const collectionOperations = {
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getFullList: vi.fn().mockResolvedValue([]),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({ id: 'new-id' }),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(true),
    getFirstListItem: vi.fn().mockResolvedValue({}),
};

export const pb = {
    collection: vi.fn(() => collectionOperations),
    authStore: {
        isValid: true,
        model: { id: 'test-user', email: 'test@example.com' },
        token: 'test-token',
        save: vi.fn(),
        clear: vi.fn(),
        onChange: vi.fn(() => vi.fn()), // Returns unsubscribe function
    },
    autoCancellation: vi.fn(),
};

export default pb;
