
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, logSecurityEvent } from '@/utils/security';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { toast } from 'sonner';

interface SecureRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const SecureRoute: React.FC<SecureRouteProps> = ({
  children,
  requiredPermission,
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        // Check permission if required
        if (requiredPermission) {
          const hasReqPermission = await hasPermission(user.id, requiredPermission);
          if (!hasReqPermission) {
            await logSecurityEvent({
              type: 'permission_denied',
              userId: user.id,
              details: { 
                permission: requiredPermission, 
                route: location.pathname 
              }
            });
            setHasAccess(false);
            toast.error('Access denied: Insufficient permissions');
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking route access:', error);
        setHasAccess(false);
        toast.error('Error verifying access permissions');
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, requiredPermission, location.pathname]);

  if (loading || hasAccess === null) {
    return <LoadingFallback message="Verifying access..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
