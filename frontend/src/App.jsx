import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// Pages
import AuthPage        from './pages/AuthPage';
import AdminDashboard  from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import KitchenEmployeeDashboard from './pages/KitchenEmployeeDashboard';
import AccessDenied    from './pages/AccessDenied';

// Auth utilities
import { getToken, getRole, storeAuthData, getRoleRedirectPath } from './hooks/useAuth';
import { getMe } from './services/authApi';

// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token    = getToken();
  const role     = getRole();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

// ─── Auth Guard for Root Route ───────────────────────────────────────────────
const AuthGuard = () => {
  const token = getToken();
  const role  = getRole();
  if (token && role) return <Navigate to={getRoleRedirectPath(role)} replace />;
  return <AuthPage />;
};

// ─── App Content ─────────────────────────────────────────────────────────────
const AppContent = () => {
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await getMe();
          if (data?.user) {
            storeAuthData(token, data.user);
          }
        } catch {
          // Token invalid or expired, interceptor handles it
        }
      }
      setSessionChecked(true);
    };
    restoreSession();
  }, []);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <main className="flex-1">
        <Routes>
          {/* ── Public ────────────────────────────────────────────────────── */}
          <Route path="/" element={<AuthGuard />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* ── ADMIN ─────────────────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── EMPLOYEE ──────────────────────────────────────────────────── */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── CUSTOMER ──────────────────────────────────────────────────── */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── KITCHEN EMPLOYEE ──────────────────────────────────────────── */}
          <Route
            path="/kitchen-employee"
            element={
              <ProtectedRoute allowedRoles={['KITCHEN_EMPLOYEE']}>
                <KitchenEmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ─────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
