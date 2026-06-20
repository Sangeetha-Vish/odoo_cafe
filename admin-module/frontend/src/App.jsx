import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Coupons from './pages/Coupons';
import Floors from './pages/Floors';
import Tables from './pages/Tables';
import PaymentMethods from './pages/PaymentMethods';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Kds from './pages/Kds';
import CustomerDisplay from './pages/CustomerDisplay';
import SelfOrderingSettings from './pages/SelfOrderingSettings';
import MobileSelfOrder from './pages/MobileSelfOrder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Non-protected standalone routes */}
      <Route path="/kds" element={<Kds />} />
      <Route path="/customer-display" element={<CustomerDisplay />} />
      <Route path="/s/:token" element={<MobileSelfOrder />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/floors" element={<Floors />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/self-ordering" element={<SelfOrderingSettings />} />
        <Route index element={<Navigate to="/products" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
