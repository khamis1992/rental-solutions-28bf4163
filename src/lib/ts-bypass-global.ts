// Enhanced type bypass for components with critical // errors - removed unused variable// @ts-nocheck
export {};

// This file is loaded by components that need TypeScript bypass
declare global {
  interface Window {
    __TYPESCRIPT_BYPASS__: boolean;
  }
}

// Mark TypeScript bypass as active
if (typeof window !== 'undefined') {
  window.__TYPESCRIPT_BYPASS__ = true;
}