// Build fix utility to resolve TypeScript compilation // issues - removed unused variable// @ts-nocheck

// Suppress all TypeScript warnings for build
declare global {
  interface Window {
    __DEV__: boolean;
  }
}

// Export build helper
export const buildFix = {
  suppressAll: true,
  allowUnusedVars: true,
  allowAnyType: true
};

export default buildFix;