# Type Consolidation Guide

As part of the service migration project, we need to consolidate type definitions between the legacy and new systems. This document outlines the approach for Type Consolidation in Phase 4.

## Standardized Type Locations

All types should be located in these directories:
- `src/types/traffic-fine.types.ts`
- `src/types/legal-case.types.ts`

## Legacy Type Locations (Deprecated)

The following legacy type locations have been removed:
- ❌ `src/hooks/traffic/types.ts`
- ❌ `src/hooks/legal/types.ts`

## Type Migration Mapping

### Traffic Fine Types

| Legacy Type | New Type | New Location |
|-------------|----------|--------------|
| `TrafficFine` | `TrafficFine` | `src/types/traffic-fine.types.ts` |
| `TrafficFineCustomer` | `Customer` | `src/types/customer.types.ts` |
| `TrafficFineCreatePayload` | `TrafficFineCreateInput` | `src/types/traffic-fine.types.ts` |
| `TrafficFineQueryOptions` | `TrafficFineQueryOptions` | `src/types/traffic-fine.types.ts` |
| `TrafficFineStatus` | `TrafficFineStatus` | `src/types/traffic-fine.types.ts` |

### Legal Case Types

| Legacy Type | New Type | New Location |
|-------------|----------|--------------|
| `LegalCase` | `LegalCase` | `src/types/legal-case.types.ts` |
| `LegalCaseCreatePayload` | `LegalCaseCreateInput` | `src/types/legal-case.types.ts` |
| `LegalCaseStatus` | `LegalCaseStatus` | `src/types/legal-case.types.ts` |
| `LegalCaseType` | `LegalCaseType` | `src/types/legal-case.types.ts` |
| `CasePriority` | `CasePriority` | `src/types/legal-case.types.ts` |
| `UseLegalCasesOptions` | `LegalCaseQueryOptions` | `src/types/legal-case.types.ts` |

## Type Usage Guidelines

1. Always import types from the standardized type locations
2. Use consistent naming conventions with CamelCase for types and interfaces
3. Prefer using zod schemas to validate data at runtime
4. Keep all related types together in the same file

## Example Usage

```typescript
// ❌ Don't import from legacy locations 
import { TrafficFine } from '@/hooks/traffic/types'; 

// ✅ DO import from standardized locations
import { TrafficFine } from '@/types/traffic-fine.types';
import { LegalCase } from '@/types/legal-case.types';
```

## Adding New Types

When adding new types related to these domains:

1. Add them to the appropriate file in the `src/types/` directory
2. Create zod validation schemas in the `src/schemas/` directory
3. Add JSDoc comments to describe complex types
4. Consider adding examples in the comments for clarity
