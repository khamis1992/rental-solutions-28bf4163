
export interface PermissionSettings {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  vehicles: PermissionSettings;
  customers: PermissionSettings;
  agreements: PermissionSettings;
  financials: PermissionSettings;
  userManagement: PermissionSettings;
}

import { UserRole } from './user-types';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    vehicles: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    agreements: { view: true, create: true, edit: true, delete: true },
    financials: { view: true, create: true, edit: true, delete: true },
    userManagement: { view: true, create: true, edit: true, delete: true }
  },
  staff: {
    vehicles: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    agreements: { view: true, create: true, edit: true, delete: false },
    financials: { view: true, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false }
  }
};
