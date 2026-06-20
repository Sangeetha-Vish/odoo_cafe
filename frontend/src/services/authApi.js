import api from './api';

/**
 * POST /auth/login
 * Returns { success, token, user: { id, name, email, role } }
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * POST /auth/signup
 * Returns { success, message }
 */
export const signup = async (name, email, password, role) => {
  const response = await api.post('/auth/signup', { name, email, password, role });
  return response.data;
};

/**
 * GET /auth/me  — verifies the stored JWT is still valid and returns the user profile.
 * Used for session restore on page load.
 * Returns { success, user: { id, name, email, role } }
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
