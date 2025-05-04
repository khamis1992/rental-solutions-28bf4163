
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait until auth is loaded before making routing decisions
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        navigate('/auth/login', { 
          replace: true, 
          state: { from: location } // Remember where they were trying to go
        });
      }
    }
  }, [user, loading, navigate, location]);

  // Show nothing while loading
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not logged in, return nothing (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  // If logged in, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
