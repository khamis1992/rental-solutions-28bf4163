
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const RootLayout = () => {
  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <Outlet />
      </>
    </ProtectedRoute>
  );
};

export default RootLayout;
