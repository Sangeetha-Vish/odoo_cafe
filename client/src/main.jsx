import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@shared-auth/AuthContext.jsx';
import ProtectedRoute from '@shared-auth/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import KitchenDashboard from './pages/KitchenDashboard.jsx';
import SelfOrderEntry from './pages/SelfOrderEntry.jsx';
import SelfOrderMenu from './pages/SelfOrderMenu.jsx';
import SelfOrderCheckout from './pages/SelfOrderCheckout.jsx';
import SelfOrderStatus from './pages/SelfOrderStatus.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['kitchen_employee']}>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Public customer-facing self-ordering routes */}
          <Route path="/self-order" element={<SelfOrderEntry />} />
          <Route path="/self-order/menu" element={<SelfOrderMenu />} />
          <Route path="/self-order/checkout" element={<SelfOrderCheckout />} />
          <Route path="/self-order/status/:orderId" element={<SelfOrderStatus />} />

          <Route path="*" element={<Navigate to="/self-order" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);

