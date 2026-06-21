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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/floors" element={<Floors />} />
        <Route path="/tables" element={<Tables />} />
        <Route index element={<Navigate to="/products" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
