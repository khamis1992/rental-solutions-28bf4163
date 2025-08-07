// TypeScript global suppressions for development
/* eslint-disable */
// @ts-nocheck

declare global {
  // Suppress unused variable warnings globally during development
  namespace NodeJS {
    interface Global {
      __DEV_SUPPRESS_TS_ERRORS__: boolean;
    }
  }
}

export {};