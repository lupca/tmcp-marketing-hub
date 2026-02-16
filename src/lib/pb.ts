// Backward compatibility layer
import pb from './pocketbase';
export * from './pocketbase';

// Re-export specific functions that were in the old pb.js if needed
// For now, most pages import { pb } or default export from there?
// The old pb.js had named exports: getToken, getUserId, setToken, isAuthenticated, logout, authWithPassword, list, getOne, create, update, remove.

// We need to implement these shims using the new SDK to avoid breaking everything immediately.

export function getToken() {
    return pb.authStore.token;
}

export function getUserId() {
    return pb.authStore.model?.id;
}

export function setToken(token: string) {
    if (token) {
        pb.authStore.save(token, null);
    } else {
        pb.authStore.clear();
    }
}

export function isAuthenticated() {
    return pb.authStore.isValid;
}

export function logout() {
    pb.authStore.clear();
}

// Data fetching shims
// Note: These are rough approximations. The new code should use pb.collection()...
export async function list(collection: string, params: any = {}) {
    // Convert params to PB SDK format if needed
    return pb.collection(collection).getList(params.page || 1, params.perPage || 30, params);
}

export async function getOne(collection: string, id: string, params: any = {}) {
    return pb.collection(collection).getOne(id, params);
}

export async function create(collection: string, body: any) {
    return pb.collection(collection).create(body);
}

export async function update(collection: string, id: string, body: any) {
    return pb.collection(collection).update(id, body);
}

export async function remove(collection: string, id: string) {
    return pb.collection(collection).delete(id);
}

export async function authWithPassword(identity: string, password: string) {
    return pb.collection('users').authWithPassword(identity, password);
}
