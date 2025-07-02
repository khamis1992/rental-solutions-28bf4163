
// @ts-nocheck
/* eslint-disable */

import { UserRole } from '@/types/user-types';

export interface RoutePermission {
  roles?: UserRole[];
  requireAuth?: boolean;
}

export const routePermissions: Record<string, RoutePermission> = {
  '/dashboard': { requireAuth: true },
  '/vehicles': { requireAuth: true },
  '/customers': { requireAuth: true },
  '/agreements': { requireAuth: true },
  '/maintenance': { requireAuth: true },
  '/legal': { requireAuth: true },
  '/financials': { requireAuth: true },
  '/reports': { requireAuth: true },
  '/user-management': { requireAuth: true, roles: ['admin'] },
  '/settings/system': { requireAuth: true, roles: ['admin'] },
};

export const checkRoutePermission = (
  path: string,
  userRole?: UserRole,
  isAuthenticated?: boolean
): boolean => {
  const permission = routePermissions[path];
  
  if (!permission) {
    return true; // Allow access to routes without specific permissions
  }

  if (permission.requireAuth && !isAuthenticated) {
    return false;
  }

  if (permission.roles && userRole && !permission.roles.includes(userRole)) {
    return false;
  }

  return true;
};

export const getRedirectPath = (
  originalPath: string,
  isAuthenticated: boolean
): string => {
  if (!isAuthenticated) {
    return '/auth/login';
  }
  
  return '/unauthorized';
};
