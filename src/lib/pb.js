// PocketBase REST API Client
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || '/pb';

let authToken = localStorage.getItem('pb_token') || null;
let userId = localStorage.getItem('pb_user_id') || null;

export function getToken() {
  return authToken;
}

export function getUserId() {
  return userId;
}

export function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('pb_token', token);
  } else {
    localStorage.removeItem('pb_token');
  }
}

function setUserId(id) {
  userId = id;
  if (id) {
    localStorage.setItem('pb_user_id', id);
  } else {
    localStorage.removeItem('pb_user_id');
  }
}

export function isAuthenticated() {
  return !!authToken;
}

export function logout() {
  setToken(null);
  setUserId(null);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${PB_URL}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'API Error');
    err.status = res.status;
    err.data = data.data;
    throw err;
  }
  return data;
}

// Auth
export async function authWithPassword(identity, password) {
  const data = await request('/api/collections/users/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ identity, password }),
  });
  setToken(data.token);
  setUserId(data.record?.id || data.id);
  return data;
}

// Generic CRUD
export async function list(collection, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.perPage) query.set('perPage', params.perPage);
  if (params.sort) query.set('sort', params.sort);
  if (params.filter) query.set('filter', params.filter);
  if (params.expand) query.set('expand', params.expand);
  const qs = query.toString();
  return request(`/api/collections/${collection}/records${qs ? '?' + qs : ''}`);
}

export async function getOne(collection, id, params = {}) {
  const query = new URLSearchParams();
  if (params.expand) query.set('expand', params.expand);
  const qs = query.toString();
  return request(`/api/collections/${collection}/records/${id}${qs ? '?' + qs : ''}`);
}

export async function create(collection, body) {
  return request(`/api/collections/${collection}/records`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function update(collection, id, body) {
  return request(`/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function remove(collection, id) {
  return request(`/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
  });
}

export { PB_URL };
