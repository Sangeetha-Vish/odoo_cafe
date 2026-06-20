/**
 * useAuth.js — Centralized Auth Utility Hook
 * 
 * Provides consistent localStorage management for JWT auth across the entire app.
 * All pages should use these helpers instead of raw localStorage calls.
 */

// ----- localStorage Keys -----
const KEYS = {
  TOKEN: 'token',
  ROLE: 'role',
  USER: 'user',
  USER_ID: 'userId',
};

// ----- Storage Helpers -----

/**
 * Persist login data from a successful auth response.
 * @param {string} token - JWT token
 * @param {{ id, name, email, role }} user - User object from backend
 */
export const storeAuthData = (token, user) => {
  localStorage.setItem(KEYS.TOKEN, token);
  localStorage.setItem(KEYS.ROLE, user.role);
  localStorage.setItem(KEYS.USER_ID, String(user.id));
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

/**
 * Clear all auth data (logout).
 */
export const clearAuthData = () => {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.ROLE);
  localStorage.removeItem(KEYS.USER_ID);
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem('customer_cart'); // also clear cart on logout
};

/**
 * Retrieve the current auth token.
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem(KEYS.TOKEN);

/**
 * Retrieve the stored user role (ADMIN | EMPLOYEE | CUSTOMER).
 * @returns {string|null}
 */
export const getRole = () => localStorage.getItem(KEYS.ROLE);

/**
 * Retrieve the stored user ID.
 * @returns {string|null}
 */
export const getUserId = () => localStorage.getItem(KEYS.USER_ID);

/**
 * Retrieve the full user object.
 * @returns {{ id, name, email, role } | null}
 */
export const getUser = () => {
  const raw = localStorage.getItem(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Check if a user is authenticated.
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken();

/**
 * Get the default redirect path for a given role.
 * @param {string} role
 * @returns {string} path
 */
export const getRoleRedirectPath = (role) => {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN':    return '/admin';
    case 'EMPLOYEE': return '/employee';
    case 'CUSTOMER': return '/customer';
    case 'KITCHEN_EMPLOYEE': return '/kitchen-employee';
    default:         return '/';
  }
};
