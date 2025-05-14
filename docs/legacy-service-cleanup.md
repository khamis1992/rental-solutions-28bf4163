# Legacy Service Implementation Cleanup Script

This guide outlines the steps to remove legacy service implementations now that we've completed
the migration to standardized services with improved error handling, TypeScript typing, and Zod validation.

## Steps to Remove Legacy Files

1. Traffic Fines Legacy Files
   - Delete `src/hooks/traffic/use-traffic-fines.ts`
   - Delete `src/hooks/traffic/use-traffic-fine-mutations.ts`
   - Delete `src/hooks/traffic/use-fine-data-fetching.ts`
   - Delete `src/hooks/traffic/types.ts`
   - Delete `src/hooks/traffic/index.ts`

2. Legal Cases Legacy Files
   - Delete `src/hooks/legal/useLegalCases.ts`
   - Delete `src/hooks/legal/types.ts`

## Verification Tasks

After removing the files:

1. Run the type-checker to ensure no references to deleted types remain:
   ```bash
   npm run type-check
   ```

2. Test all components that were using the legacy hooks to ensure they work with the adapters:
   - TrafficFineEntry.tsx
   - TrafficFineValidation.tsx
   - TrafficFineReport.tsx
   - LegalCaseManagement.tsx
   - LegalDashboard.tsx

3. Run the application and verify functionality:
   ```bash
   npm run dev
   ```

## Import Recommendations

For future imports:

- Use `import { useTrafficFineAdapter } from '@/hooks/adapters/use-traffic-fine-adapter';` for traffic fine functionality
- Use `import { useLegalCaseAdapter } from '@/hooks/adapters/use-legal-case-adapter';` for legal case functionality
- For new components, prefer using the query hooks directly:
  - `import { useTrafficFineQuery } from '@/hooks/use-traffic-fine-query';`
  - `import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';`

## Note

Adapters should only be used in components that haven't been fully migrated. New components
should use the standardized query hooks directly for best type safety and performance.
