
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as pbLib from './pb';
// We mock the default export of pocketbase
import pb from './pocketbase';

// Mock the pocketbase module
vi.mock('./pocketbase', () => {
    const listMock = vi.fn();
    const getOneMock = vi.fn();
    const createMock = vi.fn();
    const updateMock = vi.fn();
    const deleteMock = vi.fn();
    const authWithPasswordMock = vi.fn();

    const collectionMock = vi.fn(() => ({
        getList: listMock,
        getOne: getOneMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
        authWithPassword: authWithPasswordMock,
    }));

    const pbInstance = {
        authStore: {
            token: '',
            model: null,
            isValid: false,
            save: vi.fn(),
            clear: vi.fn(),
        },
        collection: collectionMock,
    };

    return {
        default: pbInstance,
        // You might need to mock named exports if pb.ts uses them, but it imports default
    };
});

describe('pb lib wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset authStore state
        pb.authStore.token = '';
        pb.authStore.model = null;
        pb.authStore.isValid = false;
    });

    describe('Auth helpers', () => {
        it('getToken returns token from authStore', () => {
            pb.authStore.token = 'test-token';
            expect(pbLib.getToken()).toBe('test-token');
        });

        it('getUserId returns user id from authStore', () => {
            pb.authStore.model = { id: 'user-123' };
            expect(pbLib.getUserId()).toBe('user-123');
        });

        it('setToken saves token if provided', () => {
            pbLib.setToken('new-token');
            expect(pb.authStore.save).toHaveBeenCalledWith('new-token', null);
        });

        it('setToken clears authStore if token is empty', () => {
            pbLib.setToken('');
            expect(pb.authStore.clear).toHaveBeenCalled();
        });

        it('isAuthenticated returns authStore validity', () => {
            pb.authStore.isValid = true;
            expect(pbLib.isAuthenticated()).toBe(true);
        });

        it('logout clears authStore', () => {
            pbLib.logout();
            expect(pb.authStore.clear).toHaveBeenCalled();
        });

        it('authWithPassword calls collection("users").authWithPassword', async () => {
            const authMock = pb.collection('users').authWithPassword;
            // Mocking return for the generic collection call above might be tricky with closures
            // But collection() returns the object with methods.
            // We need to access the spy directly.

            // Setup return value
            // Since collection() is called every time, we need to make sure it returns the same spies or we can access them via the mock.
            // In the mock setup, collectionMock returns new objects or same?
            // "vi.fn(() => ({...}))" returns a NEW object deep down if referenced directly, but spies are created outside.
            // Ah, I defined listMock outside. So they are stable references.

            await pbLib.authWithPassword('user', 'pass');

            // Call collection('users') logic in pb.ts: pb.collection('users').authWithPassword(...)
            expect(pb.collection).toHaveBeenCalledWith('users');
            // The object returned by collection() has authWithPassword which is authWithPasswordMock
            // However, typescript might complain about accessing hidden properties.
            // We can inspect the calls on the stable mocks if we can export them from the mock or access them via the calls.

            // Actually, I can just use pb.collection('users').authWithPassword as a reference if I knew it.
            // But pb.collection is a mock. pb.collection('users') returns the object.
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.authWithPassword).toHaveBeenCalledWith('user', 'pass');
        });
    });

    describe('Data helpers', () => {
        it('list calls collection().getList with correct params', async () => {
            await pbLib.list('items', { page: 2, perPage: 10, filter: 'x=1' });

            expect(pb.collection).toHaveBeenCalledWith('items');
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.getList).toHaveBeenCalledWith(2, 10, { page: 2, perPage: 10, filter: 'x=1' });
        });

        it('getOne calls collection().getOne', async () => {
            await pbLib.getOne('items', 'id123', { expand: 'rel' });

            expect(pb.collection).toHaveBeenCalledWith('items');
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.getOne).toHaveBeenCalledWith('id123', { expand: 'rel' });
        });

        it('create calls collection().create', async () => {
            const data = { name: 'test' };
            await pbLib.create('items', data);

            expect(pb.collection).toHaveBeenCalledWith('items');
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.create).toHaveBeenCalledWith(data);
        });

        it('update calls collection().update', async () => {
            const data = { name: 'updated' };
            await pbLib.update('items', 'id123', data);

            expect(pb.collection).toHaveBeenCalledWith('items');
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.update).toHaveBeenCalledWith('id123', data);
        });

        it('remove calls collection().delete', async () => {
            await pbLib.remove('items', 'id123');

            expect(pb.collection).toHaveBeenCalledWith('items');
            const collectionResult = pb.collection.mock.results[0].value;
            expect(collectionResult.delete).toHaveBeenCalledWith('id123');
        });
    });
});
