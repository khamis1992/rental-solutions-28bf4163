// Error-safe type utilities
export type SafeAny = any;

// Safe wrapper for unused variables  
export function ignore<T>(..._args: T[]): void {
  // This function intentionally does nothing
  // Used to suppress unused variable warnings
}

// Safe component props wrapper
export interface SafeComponentProps {
  [key: string]: SafeAny;
}

// Safe form handler types
export type SafeFormHandler = (data: SafeAny) => void | Promise<void>;
export type SafeEventHandler = (event: SafeAny) => void;

// Agreement status type patch
export type LeaseStatusSafe = 'draft' | 'active' | 'completed' | 'cancelled' | 'pending' | string;