import { supabase } from './supabaseClient.js';

/**
 * Attaches Supabase access tokens to outgoing API requests and signs out on 401/403.
 * Pass your axios instance (or any fetch-compatible client with interceptors).
 */
export function attachAuthInterceptors(api, { loginPath = '/login' } = {}) {
  api.interceptors.request.use(async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;

      // 401 = unauthenticated / token expired → sign out and redirect to login
      if (status === 401) {
        await supabase.auth.signOut();
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }

      // 403 = authenticated but wrong role → DO NOT sign out, just surface the error

      return Promise.reject(error);
    }
  );

  return api;
}
