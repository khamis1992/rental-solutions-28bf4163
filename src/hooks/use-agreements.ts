
// This file is kept for backward compatibility
// Import from src/hooks/agreements/index.ts in new code
import { useAgreements as useAgreementsNew } from './agreements';
import { SimpleAgreement } from './agreements/types';

// Re-export the types for backward compatibility
export type { SimpleAgreement };

// Re-export the hook directly
export const useAgreements = useAgreementsNew;
