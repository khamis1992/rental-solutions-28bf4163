
import { AuthUser } from './types';
import { UserRole } from '@/types/user-types';

export const extractUserFromSession = (sessionUser: any): AuthUser | null => {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    full_name: sessionUser.user_metadata?.full_name || sessionUser.email,
    role: sessionUser.user_metadata?.role || 'customer',
    status: sessionUser.user_metadata?.status || 'active',
    created_at: sessionUser.created_at,
    updated_at: sessionUser.updated_at,
  };
};

export const hasPermission = (
  userRole: UserRole | undefined,
  requiredRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === 'admin';
};

export const isStaff = (userRole: UserRole | undefined): boolean => {
  return userRole === 'staff' || userRole === 'admin';
};

export const formatUserDisplayName = (user: AuthUser): string => {
  return user.full_name || user.email || 'Unknown User';
};

export const getUserInitials = (user: AuthUser): string => {
  const name = user.full_name || user.email;
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};
