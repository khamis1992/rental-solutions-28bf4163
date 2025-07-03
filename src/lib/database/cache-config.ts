/**
 * إعدادات التخزين المؤقت للاستعلامات
 * Database Query Cache Configuration
 */

export const CACHE_KEYS = {
  AGREEMENTS_LIST: 'agreements:list',
  CUSTOMERS_LIST: 'customers:list', 
  VEHICLES_LIST: 'vehicles:list',
  AGREEMENT_STATS: 'stats:agreements',
  PAYMENT_STATS: 'stats:payments',
  DASHBOARD_DATA: 'dashboard:data',
  USER_PERMISSIONS: 'user:permissions'
} as const;

export const CACHE_TTL = {
  SHORT: 300,     // 5 minutes
  MEDIUM: 900,    // 15 minutes  
  LONG: 3600,     // 1 hour
  DAILY: 86400    // 24 hours
} as const;

export const CACHE_SETTINGS = {
  [CACHE_KEYS.AGREEMENTS_LIST]: CACHE_TTL.SHORT,
  [CACHE_KEYS.CUSTOMERS_LIST]: CACHE_TTL.MEDIUM,
  [CACHE_KEYS.VEHICLES_LIST]: CACHE_TTL.MEDIUM,
  [CACHE_KEYS.AGREEMENT_STATS]: CACHE_TTL.LONG,
  [CACHE_KEYS.PAYMENT_STATS]: CACHE_TTL.LONG,
  [CACHE_KEYS.DASHBOARD_DATA]: CACHE_TTL.SHORT,
  [CACHE_KEYS.USER_PERMISSIONS]: CACHE_TTL.LONG
} as const; 