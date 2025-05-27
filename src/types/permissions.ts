
export interface PermissionSettings {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  agreements: PermissionSettings;
  customers: PermissionSettings;
  vehicles: PermissionSettings;
  payments: PermissionSettings;
  reports: PermissionSettings;
  settings: PermissionSettings;
  userManagement: PermissionSettings;
  legal: PermissionSettings;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    agreements: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    vehicles: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    userManagement: { view: true, create: true, edit: true, delete: true },
    legal: { view: true, create: true, edit: true, delete: true }
  },
  staff: {
    agreements: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    vehicles: { view: true, create: false, edit: false, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    legal: { view: true, create: true, edit: true, delete: false }
  }
};
