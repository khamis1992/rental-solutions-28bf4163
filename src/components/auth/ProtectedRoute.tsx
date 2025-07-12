import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSafeAuth } from "@/contexts/SafeAuthContext";
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
  const location = useLocation();
  
  // Use try-catch to handle potential context issues
  let authState;
  let profileState;
  
  try {
    authState = useSafeAuth();
  } catch (error) {
    console.error('Error accessing AuthContext:', error);
    return <LoadingFallback />;
  }
  
  try {
    profileState = useProfile();
  } catch (error) {
    console.error('Error accessing ProfileContext:', error);
    profileState = { profile: null, isLoading: true, error: null, updateProfile: async () => {} };
  }

  const { user, loading: authLoading } = authState;
  const { profile, isLoading: profileLoading } = profileState;

  // Show loading state while auth or profile is loading
  if (authLoading || (requireProfile && profileLoading)) {
    return <LoadingFallback />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If profile is required but not loaded and we're not loading, allow access
  // This prevents infinite redirects when profile doesn't exist yet
  if (requireProfile && !profile && !profileLoading) {
    console.log('Profile required but not found, proceeding without profile requirement');
  }

  // Check role-based access if roles are specified
  if (roles.length > 0 && profile) {
    const userRole = profile.role ?? "staff";
    const hasRequiredRole = roles.includes(userRole);

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;