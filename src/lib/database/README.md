
# Type-Safe Database Layer

This folder contains a complete implementation of a type-safe database access layer for the Fleet Management System.

## Overview

The database layer is structured to provide:

1. **Type Safety**: All database operations are fully typed using TypeScript interfaces and generics.
2. **Runtime Validation**: Values are validated at runtime to ensure they match expected types.
3. **Repository Pattern**: Each entity has its own repository that encapsulates database access logic.
4. **Centralized Types**: All types are defined in one place, providing a single source of truth.

## Key Components

### Types (`types.ts`)

Contains all core type definitions used throughout the database layer. Includes:

- Table row types
- Insert/Update types
- Response types
- Type guard functions

### Validation (`validation.ts`)

Contains functions for validating values at runtime:

- Status validation functions (e.g., `asVehicleStatus`)
- Type guards for common types (e.g., `isString`, `isNumber`)
- Object shape validators

### Repository (`repository.ts`)

Implements the repository pattern with:

- Base repository with CRUD operations
- Type-safe database access methods
- Error handling and logging

### Entity-Specific Repositories

Each entity has its own repository with specialized methods:

- `vehicle-repository.ts`
- `lease-repository.ts`
- etc.

## Usage Examples

### Fetching a Vehicle

```typescript
import { vehicleRepository } from '@/lib/database';

// Fetch a vehicle by ID
const vehicle = await vehicleRepository.findById('some-uuid');

// Fetch vehicles by status (with runtime validation)
const availableVehicles = await vehicleRepository.findVehicles({ status: 'available' });
```

### Updating a Lease Status

```typescript
import { leaseRepository } from '@/lib/database';

// Update lease status with validation
const updatedLease = await leaseRepository.updateStatus(
  'lease-uuid', 
  'completed', 
  'Lease completed by customer'
);
```

## Best Practices

1. **Always use repository methods** instead of direct Supabase calls
2. **Never use `as any`** for type casting
3. **Validate input values** before operations
4. **Handle errors properly** using the provided type guards
5. **Add new entity types** to the central types file

## Extending

To add a new entity:

1. Add types to `types.ts`
2. Add validation functions to `validation.ts`
3. Create a new repository file (e.g., `new-entity-repository.ts`)
4. Export from `index.ts`
