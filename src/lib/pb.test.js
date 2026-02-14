import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to mock fetch and localStorage before importing pb.js
// because pb.js reads localStorage at module load time.

describe('pb.js - PocketBase REST Client', () => {
    let pb;

    beforeEach(async () => {
        // Clear localStorage
        localStorage.clear();
        // Reset fetch mock
        vi.restoreAllMocks();
        // Re-import pb.js fresh each test
        vi.resetModules();
        pb = await import('./pb.js');
    });

    describe('Authentication', () => {
        it('authWithPassword stores token and userId', async () => {
            const mockResponse = {
                token: 'test-jwt-token-123',
                record: { id: 'user-abc-123', email: 'admin@admin.com' },
            };

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await pb.authWithPassword('admin@admin.com', 'password');

            expect(result.token).toBe('test-jwt-token-123');
            expect(result.record.id).toBe('user-abc-123');
            expect(pb.getToken()).toBe('test-jwt-token-123');
            expect(pb.getUserId()).toBe('user-abc-123');
            expect(localStorage.getItem('pb_token')).toBe('test-jwt-token-123');
            expect(localStorage.getItem('pb_user_id')).toBe('user-abc-123');
        });

        it('authWithPassword falls back to data.id when data.record is missing', async () => {
            const mockResponse = {
                token: 'fallback-token',
                id: 'fallback-user-id',
            };

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
            });

            await pb.authWithPassword('admin@admin.com', 'password');

            expect(pb.getUserId()).toBe('fallback-user-id');
        });

        it('authWithPassword throws on auth failure', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ message: 'Invalid credentials' }),
            });

            await expect(pb.authWithPassword('bad@email.com', 'wrong'))
                .rejects.toThrow('Invalid credentials');
        });

        it('isAuthenticated returns true when token exists', async () => {
            const mockResponse = {
                token: 'a-token',
                record: { id: 'uid' },
            };

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
            });

            expect(pb.isAuthenticated()).toBe(false);
            await pb.authWithPassword('a@b.com', 'p');
            expect(pb.isAuthenticated()).toBe(true);
        });

        it('logout clears token and userId', async () => {
            // First, authenticate
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ token: 't', record: { id: 'u' } }),
            });
            await pb.authWithPassword('a@b.com', 'p');

            expect(pb.getToken()).toBe('t');
            expect(pb.getUserId()).toBe('u');

            pb.logout();

            expect(pb.getToken()).toBeNull();
            expect(pb.getUserId()).toBeNull();
            expect(localStorage.getItem('pb_token')).toBeNull();
            expect(localStorage.getItem('pb_user_id')).toBeNull();
        });

        it('restores token and userId from localStorage on module load', async () => {
            localStorage.setItem('pb_token', 'persisted-token');
            localStorage.setItem('pb_user_id', 'persisted-user');

            vi.resetModules();
            const freshPb = await import('./pb.js');

            expect(freshPb.getToken()).toBe('persisted-token');
            expect(freshPb.getUserId()).toBe('persisted-user');
            expect(freshPb.isAuthenticated()).toBe(true);
        });
    });

    describe('CRUD Operations', () => {
        beforeEach(async () => {
            // Authenticate first so auth headers are sent
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ token: 'auth-token', record: { id: 'uid' } }),
            });
            await pb.authWithPassword('a@b.com', 'p');
        });

        it('list() calls GET with query params', async () => {
            const mockData = { items: [{ id: '1' }], totalItems: 1, totalPages: 1 };
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockData),
            });

            const result = await pb.list('business_ideas', { perPage: 10, sort: '-created' });

            expect(result.items).toHaveLength(1);
            const callUrl = globalThis.fetch.mock.calls[0][0];
            expect(callUrl).toContain('/api/collections/business_ideas/records');
            expect(callUrl).toContain('perPage=10');
            expect(callUrl).toContain('sort=-created');
        });

        it('list() sends Authorization header', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ items: [] }),
            });

            await pb.list('business_ideas');

            const callHeaders = globalThis.fetch.mock.calls[0][1].headers;
            expect(callHeaders.Authorization).toBe('Bearer auth-token');
        });

        it('create() calls POST with JSON body', async () => {
            const mockRecord = { id: 'new-1', rawIdea: 'test idea' };
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockRecord),
            });

            const body = { rawIdea: 'test idea', userId: 'uid' };
            const result = await pb.create('business_ideas', body);

            expect(result.id).toBe('new-1');
            const [url, opts] = globalThis.fetch.mock.calls[0];
            expect(url).toContain('/api/collections/business_ideas/records');
            expect(opts.method).toBe('POST');
            const sentBody = JSON.parse(opts.body);
            expect(sentBody.rawIdea).toBe('test idea');
            expect(sentBody.userId).toBe('uid');
        });

        it('update() calls PATCH with JSON body', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'rec1', name: 'updated' }),
            });

            await pb.update('business_ideas', 'rec1', { rawIdea: 'updated' });

            const [url, opts] = globalThis.fetch.mock.calls[0];
            expect(url).toContain('/api/collections/business_ideas/records/rec1');
            expect(opts.method).toBe('PATCH');
        });

        it('remove() calls DELETE', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 204,
            });

            const result = await pb.remove('business_ideas', 'rec1');

            expect(result).toBeNull();
            const [url, opts] = globalThis.fetch.mock.calls[0];
            expect(url).toContain('/api/collections/business_ideas/records/rec1');
            expect(opts.method).toBe('DELETE');
        });

        it('getOne() calls GET with id', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'rec1', rawIdea: 'idea' }),
            });

            const result = await pb.getOne('business_ideas', 'rec1');

            expect(result.id).toBe('rec1');
            const callUrl = globalThis.fetch.mock.calls[0][0];
            expect(callUrl).toContain('/api/collections/business_ideas/records/rec1');
        });

        it('getOne() supports expand param', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'rec1' }),
            });

            await pb.getOne('business_ideas', 'rec1', { expand: 'userId' });

            const callUrl = globalThis.fetch.mock.calls[0][0];
            expect(callUrl).toContain('expand=userId');
        });
    });

    describe('Error Handling', () => {
        it('throws error with message and status for non-ok responses', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    message: 'Failed to create record.',
                    data: { userId: { code: 'validation_required', message: 'cannot be blank' } },
                }),
            });

            try {
                await pb.create('business_ideas', { rawIdea: 'no userId!' });
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).toBe('Failed to create record.');
                expect(err.status).toBe(400);
                expect(err.data.userId.message).toBe('cannot be blank');
            }
        });
    });
});
