
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserSettings from '@/pages/UserSettings';
import SystemSettings from '@/pages/SystemSettings';
import UserManagement from '@/pages/UserManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const SettingsRoutes = () => {
  return (
    <Routes>
      <Route index element={<UserSettings />} />
      <Route path="system" element={<SystemSettings />} />
      <Route 
        path="/user-management" 
        element={
          <ProtectedRoute roles={["admin"]}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default SettingsRoutes;
