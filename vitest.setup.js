import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PocketBase
const mockCollection = {
  getFullList: vi.fn().mockResolvedValue([]),
  getList: vi.fn().mockResolvedValue({ items: [] }),
  getOne: vi.fn().mockResolvedValue({}),
  create: vi.fn().mockResolvedValue({ id: 'test-id' }),
  update: vi.fn().mockResolvedValue({ id: 'test-id' }),
  delete: vi.fn().mockResolvedValue(true),
  subscribe: vi.fn().mockResolvedValue(() => {}),
};

const mockPb = {
  collection: vi.fn(() => mockCollection),
  files: {
    getURL: vi.fn((record, filename) => `/pb/api/files/${record?.collectionName || 'unknown'}/${record?.id || 'unknown'}/${filename}`),
  },
  authStore: {
    token: 'test-token',
    isValid: true,
    model: { id: 'user-123', email: 'test@test.com' },
    onChange: vi.fn().mockReturnValue(() => {}),
    clear: vi.fn(),
    save: vi.fn(),
  },
};

vi.mock('./src/lib/pocketbase', () => ({
  pb: mockPb,
  default: mockPb,
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
