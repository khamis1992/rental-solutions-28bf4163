// RLS Management Utilities
// Provides functions for managing user roles and security

import React from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Available user roles in the system
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EMPLOYEE: 'employee',
  ACCOUNTANT: 'accountant',
  MAINTENANCE: 'maintenance',
  LEGAL: 'legal',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    customers: ['read', 'write', 'delete'],
    vehicles: ['read', 'write', 'delete'],
    leases: ['read', 'write', 'delete'],
    payments: ['read', 'write', 'delete'],
    maintenance: ['read', 'write', 'delete'],
    legal: ['read', 'write', 'delete'],
    reports: ['read', 'write', 'delete'],
    settings: ['read', 'write', 'delete'],
    users: ['read', 'write', 'delete']
  },
  [USER_ROLES.MANAGER]: {
    customers: ['read', 'write'],
    vehicles: ['read', 'write'],
    leases: ['read', 'write'],
    payments: ['read', 'write'],
    maintenance: ['read', 'write'],
    legal: ['read', 'write'],
    reports: ['read', 'write'],
    settings: ['read'],
    users: ['read']
  },
  [USER_ROLES.EMPLOYEE]: {
    customers: ['read', 'write'],
    vehicles: ['read', 'write'],
    leases: ['read', 'write'],
    payments: ['read'],
    maintenance: ['read', 'write'],
    legal: ['read'],
    reports: ['read'],
    settings: [],
    users: []
  },
  [USER_ROLES.ACCOUNTANT]: {
    customers: ['read'],
    vehicles: ['read'],
    leases: ['read'],
    payments: ['read', 'write'],
    maintenance: ['read'],
    legal: ['read'],
    reports: ['read', 'write'],
    settings: [],
    users: []
  },
  [USER_ROLES.MAINTENANCE]: {
    customers: ['read'],
    vehicles: ['read', 'write'],
    leases: ['read'],
    payments: [],
    maintenance: ['read', 'write'],
    legal: [],
    reports: ['read'],
    settings: [],
    users: []
  },
  [USER_ROLES.LEGAL]: {
    customers: ['read'],
    vehicles: ['read'],
    leases: ['read'],
    payments: ['read'],
    maintenance: [],
    legal: ['read', 'write'],
    reports: ['read'],
    settings: [],
    users: []
  },
  [USER_ROLES.VIEWER]: {
    customers: ['read'],
    vehicles: ['read'],
    leases: ['read'],
    payments: ['read'],
    maintenance: ['read'],
    legal: ['read'],
    reports: ['read'],
    settings: [],
    users: []
  }
};

// Check if current user has a specific role
export const hasRole = async (role: UserRole): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase.rpc('user_has_role', {
      user_uuid: user.id,
      role_name: role
    });

    return data || false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

// Check if current user has any of the specified roles
export const hasAnyRole = async (roles: UserRole[]): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase.rpc('user_has_any_role', {
      user_uuid: user.id,
      roles: roles
    });

    return data || false;
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
};

// Get current user's roles
export const getCurrentUserRoles = async (): Promise<UserRole[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.rpc('get_user_roles', {
      user_uuid: user.id
    });

    return data || [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

// Assign role to user (admin only)
export const assignUserRole = async (
  userId: string, 
  role: UserRole,
  permissions?: Record<string, any>
): Promise<boolean> => {
  try {
    // Check if current user is admin
    const isAdmin = await hasRole(USER_ROLES.ADMIN);
    if (!isAdmin) {
      toast.error('غير مصرح لك بتعديل الأدوار');
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        permissions: permissions || ROLE_PERMISSIONS[role],
        created_by: user.id
      });

    if (error) {
      console.error('Error assigning role:', error);
      toast.error(`فشل في تعيين الدور: ${error.message}`);
      return false;
    }

    toast.success('تم تعيين الدور بنجاح');
    return true;
  } catch (error) {
    console.error('Error assigning user role:', error);
    toast.error('حدث خطأ أثناء تعيين الدور');
    return false;
  }
};

// Remove role from user (admin only)
export const removeUserRole = async (
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    // Check if current user is admin
    const isAdmin = await hasRole(USER_ROLES.ADMIN);
    if (!isAdmin) {
      toast.error('غير مصرح لك بحذف الأدوار');
      return false;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error removing role:', error);
      toast.error(`فشل في حذف الدور: ${error.message}`);
      return false;
    }

    toast.success('تم حذف الدور بنجاح');
    return true;
  } catch (error) {
    console.error('Error removing user role:', error);
    toast.error('حدث خطأ أثناء حذف الدور');
    return false;
  }
};

// Get all users with their roles (admin/manager only)
export const getAllUsersWithRoles = async () => {
  try {
    const hasAccess = await hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]);
    if (!hasAccess) {
      toast.error('غير مصرح لك بعرض بيانات المستخدمين');
      return [];
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        permissions,
        created_at,
        profiles!inner(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users with roles:', error);
      return [];
    }

    // Group roles by user
    const usersMap = new Map();
    data?.forEach(item => {
      const userId = item.user_id;
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          user_id: userId,
          profile: item.profiles,
          roles: [],
          permissions: {}
        });
      }
      const user = usersMap.get(userId);
      user.roles.push(item.role);
      user.permissions[item.role] = item.permissions;
    });

    return Array.from(usersMap.values());
  } catch (error) {
    console.error('Error getting users with roles:', error);
    return [];
  }
};

// Check security status of all tables
export const checkSecurityStatus = async () => {
  try {
    const hasAccess = await hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]);
    if (!hasAccess) {
      toast.error('غير مصرح لك بعرض حالة الأمان');
      return [];
    }

    const { data, error } = await supabase.rpc('check_security_violations');

    if (error) {
      console.error('Error checking security status:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error checking security status:', error);
    return [];
  }
};

// Log security event
export const logSecurityEvent = async (
  actionType: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, any>
) => {
  try {
    await supabase.rpc('log_security_event', {
      action_type: actionType,
      table_name: tableName,
      record_id: recordId || null,
      details: details || null
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Permission checking utilities
export const canRead = (userRoles: UserRole[], resource: string): boolean => {
  return userRoles.some(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] as Record<string, string[]>;
    return rolePermissions?.[resource]?.includes('read');
  });
};

export const canWrite = (userRoles: UserRole[], resource: string): boolean => {
  return userRoles.some(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] as Record<string, string[]>;
    return rolePermissions?.[resource]?.includes('write');
  });
};

export const canDelete = (userRoles: UserRole[], resource: string): boolean => {
  return userRoles.some(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] as Record<string, string[]>;
    return rolePermissions?.[resource]?.includes('delete');
  });
};

// React hooks for role-based UI
export const useUserRoles = () => {
  const [roles, setRoles] = React.useState<UserRole[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRoles = async () => {
      const userRoles = await getCurrentUserRoles();
      setRoles(userRoles);
      setLoading(false);
    };
    
    fetchRoles();
  }, []);

  return { roles, loading };
};

// Export commonly used role checks
export const usePermissions = () => {
  const { roles, loading } = useUserRoles();

  return {
    roles,
    loading,
    isAdmin: roles.includes(USER_ROLES.ADMIN),
    isManager: roles.includes(USER_ROLES.MANAGER),
    isEmployee: roles.includes(USER_ROLES.EMPLOYEE),
    isAccountant: roles.includes(USER_ROLES.ACCOUNTANT),
    isMaintenance: roles.includes(USER_ROLES.MAINTENANCE),
    isLegal: roles.includes(USER_ROLES.LEGAL),
    isViewer: roles.includes(USER_ROLES.VIEWER),
    canRead: (resource: string) => canRead(roles, resource),
    canWrite: (resource: string) => canWrite(roles, resource),
    canDelete: (resource: string) => canDelete(roles, resource)
  };
}; 