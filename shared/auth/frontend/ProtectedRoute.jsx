import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * Wraps routes that require an active Supabase session and optional role allow-list.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - When provided, user.role must be included.
 * @param {string} [props.loginPath='/login'] - Redirect target when unauthenticated.
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  loginPath = '/login',
}) {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verifying session…
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to={loginPath} replace state={{ reason: 'insufficient_role' }} />;
  }

  return children;
}
