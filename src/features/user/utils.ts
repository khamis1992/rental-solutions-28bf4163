
import { UserRole, UserStatus } from '@/types/user-types';
import { UserManagementUser } from './types';

export const getUserDisplayName = (user: UserManagementUser): string => {
  return user.full_name || user.email || 'Unknown User';
};

export const getUserRoleLabel = (role: UserRole): string => {
  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    staff: 'Staff Member',
    customer: 'Customer',
  };
  
  return roleLabels[role] || role;
};

export const getUserStatusLabel = (status: UserStatus): string => {
  const statusLabels: Record<UserStatus, string> = {
    active: 'Active',
    pending_review: 'Pending Review',
    inactive: 'Inactive',
    suspended: 'Suspended',
    blacklisted: 'Blacklisted',
  };
  
  return statusLabels[status] || status;
};

export const getUserStatusColor = (status: UserStatus): string => {
  const statusColors: Record<UserStatus, string> = {
    active: 'green',
    pending_review: 'yellow',
    inactive: 'gray',
    suspended: 'orange',
    blacklisted: 'red',
  };
  
  return statusColors[status] || 'gray';
};

export const canUserPerformAction = (
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  action: 'view' | 'edit' | 'delete'
): boolean => {
  // Admin can do everything
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Staff can only view customers
  if (currentUserRole === 'staff') {
    return action === 'view' && targetUserRole === 'customer';
  }
  
  // Customers can't manage other users
  return false;
};

export const formatLastSignIn = (lastSignInAt: string | undefined): string => {
  if (!lastSignInAt) return 'Never';
  
  const date = new Date(lastSignInAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  
  return date.toLocaleDateString();
};
