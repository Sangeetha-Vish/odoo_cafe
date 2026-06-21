/** Maps the dev-server port to the role required for that portal. */
const PORT_ROLE_MAP = {
  5175: 'admin',
  5174: 'employee',
  5173: 'kitchen_employee',
};

export function getCurrentPortalRole() {
  const port = window.location.port;
  return PORT_ROLE_MAP[port] ?? null;
}

/**
 * Validates that the authenticated profile role matches the active portal.
 * Returns null when access is allowed, or an error message string when denied.
 */
export function validatePortalAccess(role) {
  const normalizedRole = role ? role.toLowerCase() : null;

  if (normalizedRole === 'customer') {
    return 'Customer platform onboarding coming soon!';
  }

  const requiredRole = getCurrentPortalRole();
  if (!requiredRole) {
    return 'Unknown portal context. Access denied.';
  }

  if (normalizedRole !== requiredRole) {
    return 'Unauthorized Portal Access';
  }

  return null;
}
