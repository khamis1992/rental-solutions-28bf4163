
export const APP_NAME = 'Fleet Management System';
export const APP_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  auth: '/auth',
  users: '/users',
  vehicles: '/vehicles',
  customers: '/customers',
  agreements: '/agreements',
  payments: '/payments',
  maintenance: '/maintenance',
  legal: '/legal',
  reports: '/reports',
} as const;

export const LOCAL_STORAGE_KEYS = {
  userPreferences: 'user-preferences',
  dashboardLayout: 'dashboard-layout',
  tableSettings: 'table-settings',
} as const;

export const SESSION_STORAGE_KEYS = {
  currentRoute: 'current-route',
  formData: 'form-data',
} as const;

export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  full: 'MMMM dd, yyyy HH:mm:ss',
} as const;

export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
} as const;

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
  },
} as const;
