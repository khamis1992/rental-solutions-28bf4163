
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { SimpleErrorBoundary } from '@/components/ui/simple-error-boundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import pages directly to avoid lazy loading issues initially
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AuthLayout from '@/pages/auth/AuthLayout';

export const AppRouter: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          
          {/* Auth routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SimpleErrorBoundary>
  );
};
