import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin } from './AdminLogin.jsx';
import { AdminLayout } from './AdminLayout.jsx';
import { AdminDashboard } from './AdminDashboard.jsx';
import { PickupPoints } from './PickupPoints.jsx';
import { Users } from './Users.jsx';
import { isAuthenticated } from './auth.js';

const Protected = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />;
};

export const AdminApp = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        path="dashboard"
        element={
          <Protected>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </Protected>
        }
      />
      <Route
        path="pickup-points"
        element={
          <Protected>
            <AdminLayout>
              <PickupPoints />
            </AdminLayout>
          </Protected>
        }
      />
      <Route
        path="users"
        element={
          <Protected>
            <AdminLayout>
              <Users />
            </AdminLayout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};