
// This file is kept for backward compatibility
// Import from src/hooks/legal/useLegalCases.ts in new code
// Legacy hook export
// This file is now a wrapper around the adapter for backward compatibility
import { useLegalCasesAdapter } from './adapters/use-legal-case-adapter';

// Re-export the adapter as the legacy hook
export const useLegalCases = useLegalCasesAdapter;
