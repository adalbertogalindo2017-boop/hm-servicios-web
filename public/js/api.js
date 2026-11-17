/* ═══════════════════════════════════════════════════════════
   api.js — REST API Client for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const api = (() => {
  const BASE_URL = '/api';

  // ── Helpers ────────────────────────────────────────────────

  /** Retrieve the stored JWT token */
  function getToken() {
    return localStorage.getItem('hm_token');
  }

  /** Build standard headers, injecting Authorization when a token exists */
  function buildHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /** Centralised response handler */
  async function handleResponse(res) {
    // Try to refresh on 401
    if (res.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry original request (caller should handle)
        return { __retry: true };
      }
      // Token refresh failed — force logout
      if (typeof auth !== 'undefined' && auth.logout) auth.logout();
      throw { status: 401, message: 'Sesión expirada. Inicia sesión de nuevo.' };
    }

    if (res.status === 204) return null; // No content

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw {
        status: res.status,
        message: (data && (data.message || data.error)) || `Error ${res.status}`,
        data
      };
    }

    // El backend responde siempre con el sobre { success, data, message }.
    // Todo el código que consume este cliente espera el payload interno
    // directamente (p. ej. { token, user } en vez de { success, data: { token, user } }),
    // así que lo desenvolvemos aquí, en un solo lugar, en vez de en cada
    // llamada. Si la respuesta no trae "data" (p. ej. solo { success, message }),
    // se devuelve el objeto completo para que el "message" siga disponible.
    if (data && Object.prototype.hasOwnProperty.call(data, 'data')) {
      return data.data;
    }
    return data;
  }

  /** Attempt to refresh the JWT using a refresh token */
  async function tryRefreshToken() {
    const refreshToken = localStorage.getItem('hm_refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('hm_token', data.token);
        if (data.refreshToken) localStorage.setItem('hm_refresh_token', data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /** Core request function with optional retry on 401 */
  async function request(method, url, body = null, attempt = 0) {
    const opts = {
      method,
      headers: buildHeaders()
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, opts);
    const result = await handleResponse(res);

    // Retry once after a token refresh
    if (result && result.__retry && attempt < 1) {
      return request(method, url, body, attempt + 1);
    }
    return result;
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    get:    (url)       => request('GET', url),
    post:   (url, data) => request('POST', url, data),
    put:    (url, data) => request('PUT', url, data),
    patch:  (url, data) => request('PATCH', url, data),
    delete: (url)       => request('DELETE', url),
    getToken,

    /** Upload a file via multipart/form-data */
    async upload(url, formData) {
      const headers = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: formData
      });
      return handleResponse(res);
    }
  };
})();
