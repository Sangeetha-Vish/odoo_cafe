import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, Outlet } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import TablesPage from './pages/TablesPage';
import PosPage from './pages/PosPage';
import OrdersPage from './pages/OrdersPage';
import { Armchair, ShoppingCart, ListOrdered, Coffee } from 'lucide-react';

// Admin Module Imports (integrated locally)
import { AuthProvider } from '../admin-module/frontend/src/context/AuthContext';
import ProtectedRoute from '../admin-module/frontend/src/components/ProtectedRoute';
import Layout from '../admin-module/frontend/src/components/Layout';
import Login from '../admin-module/frontend/src/pages/Login';
import Products from '../admin-module/frontend/src/pages/Products';
import Categories from '../admin-module/frontend/src/pages/Categories';
import Coupons from '../admin-module/frontend/src/pages/Coupons';
import Floors from '../admin-module/frontend/src/pages/Floors';
import Tables from '../admin-module/frontend/src/pages/Tables';
import PaymentMethods from '../admin-module/frontend/src/pages/PaymentMethods';
import Users from '../admin-module/frontend/src/pages/Users';
import Reports from '../admin-module/frontend/src/pages/Reports';
import Kds from '../admin-module/frontend/src/pages/Kds';
import CustomerDisplay from '../admin-module/frontend/src/pages/CustomerDisplay';
import SelfOrderingSettings from '../admin-module/frontend/src/pages/SelfOrderingSettings';
import MobileSelfOrder from '../admin-module/frontend/src/pages/MobileSelfOrder';
import SelfOrderEntry from '../admin-module/frontend/src/pages/SelfOrderEntry';

function Navigation() {
  const location = useLocation();

  const navLinks = [
    { to: '/tables', label: 'Tables Map', icon: Armchair },
    { to: '/pos', label: 'POS Workspace', icon: ShoppingCart },
    { to: '/orders', label: 'Kitchen & Orders', icon: ListOrdered },
    { to: '/admin/products', label: 'Admin Portal', icon: Coffee },
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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Standalone non-protected routes */}
              <Route path="/kds" element={<Kds />} />
              <Route path="/customer-display" element={<CustomerDisplay />} />
              <Route path="/s/:token" element={<MobileSelfOrder />} />
              <Route path="/s" element={<SelfOrderEntry />} />
              <Route path="/self-order" element={<SelfOrderEntry />} />

              {/* Admin login */}
              <Route path="/admin/login" element={<Login />} />

              {/* Admin Pages (wrapped in admin Auth and Layout) */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/products" element={<Products />} />
                <Route path="/admin/categories" element={<Categories />} />
                <Route path="/admin/coupons" element={<Coupons />} />
                <Route path="/admin/floors" element={<Floors />} />
                <Route path="/admin/tables" element={<Tables />} />
                <Route path="/admin/payment-methods" element={<PaymentMethods />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/self-ordering" element={<SelfOrderingSettings />} />
                <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
              </Route>

              {/* Main POS App Layout */}
              <Route
                element={
                  <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-600">
                    <Navigation />
                    <main className="flex-1 w-full">
                      <Outlet />
                    </main>
                    <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 font-semibold mt-auto">
                      Odoo Cafe POS Module App &copy; {new Date().getFullYear()} &middot; Designed for High Performance.
                    </footer>
                  </div>
                }
              >
                <Route path="/tables" element={<TablesPage />} />
                <Route path="/pos" element={<PosPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/" element={<Navigate to="/tables" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/tables" replace />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
