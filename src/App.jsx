import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, Outlet } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from '@shared-auth/AuthContext.jsx';
import ProtectedRoute from '@shared-auth/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import TablesPage from './pages/TablesPage';
import PosPage from './pages/PosPage';
import OrdersPage from './pages/OrdersPage';
import { Armchair, ShoppingCart, ListOrdered, Coffee } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  const navLinks = [
    { to: '/tables', label: 'Tables Map', icon: Armchair },
    { to: '/pos', label: 'POS Workspace', icon: ShoppingCart },
    { to: '/orders', label: 'Kitchen & Orders', icon: ListOrdered },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl text-slate-900 shadow-md">
              <Coffee size={20} className="animate-pulse" />
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
              Odoo Cafe POS
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 md:space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.03]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-600">
      <Navigation />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 font-semibold mt-auto">
        Odoo Cafe POS Module App &copy; {new Date().getFullYear()} &middot; Designed for High Performance.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/tables" element={<TablesPage />} />
                <Route path="/pos" element={<PosPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route index element={<Navigate to="/tables" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
