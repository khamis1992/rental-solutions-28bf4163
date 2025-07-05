import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { LoadingFallback } from "@/components/ui/loading-fallback";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requireProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles = [], 
  requireProfile = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Show loading state while auth or profile is loading
  if (authLoading || (requireProfile && profileLoading)) {
    return <LoadingFallback />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If profile is required but not loaded, redirect to profile setup
  if (requireProfile && !profile) {
    return <Navigate to="/profile/setup" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (roles.length > 0) {
    const userRole = profile?.role ?? "staff";
    const hasRequiredRole = roles.includes(userRole);

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;