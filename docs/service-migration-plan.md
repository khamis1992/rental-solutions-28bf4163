# Service Migration Plan

## Overview
This document outlines the plan to migrate from original service implementations to standardized services with improved error handling, TypeScript typing, and Zod validation.

## Phase 1: Preparation (Completed)
- ✅ Create standardized service implementations
- ✅ Create React Query hooks for each service
- ✅ Implement Zod schemas for data validation
- ✅ Apply validation to service methods

## Phase 2: Parallel Operation (In Progress)
During this phase, both original and standardized services will coexist.

### Step 1: Update Service Exports (Completed)
- ✅ Configure service exports to provide both legacy and standardized implementations
- ✅ Update type exports to ensure consistency between systems
- ✅ Create adapter hooks for backward compatibility

### Step 2: Component-Level Migrations (In Progress)
- ✅ Identify and list all components using each service
- ✅ Prioritize components for migration based on usage frequency and complexity
- ✅ Create a migration schedule for each component
- ✅ Create integration tests for standardized services

## Phase 3: Component Migration (Completed)
For each UI component that uses services:

1. ✅ Identify what data and mutations are used
2. ✅ Replace direct service calls with React Query hooks
3. ✅ Update state management to leverage React Query
4. ✅ Test functionality with standardized services
5. ✅ Remove legacy service imports

## Phase 4: Final Cleanup (Completed)
- ✅ Update remaining components (TrafficFineEntry.tsx, TrafficFineValidation.tsx, Reports.tsx)
- ✅ Create adapter hooks for backward compatibility
- ✅ Update legacy hook exports to use adapters
- ✅ Remove legacy service implementations
- ✅ Update documentation
- ✅ Consolidate type definitions

## Migration Progress Summary

### Completed Components
1. **Payment Components**
   - ✅ NewPaymentEntry.tsx
   - ✅ PaymentList.tsx
   - ✅ PaymentForAgreement.tsx
   - ✅ PaymentHistorySection.tsx
   - ✅ PaymentProcessor.tsx

2. **Maintenance Components**
   - ✅ MaintenanceList.tsx
   - ✅ MaintenanceForm.tsx
   - ✅ MaintenanceRecord.tsx
   - ✅ MaintenanceSchedulingWizard.tsx

3. **Traffic Fine Components**
   - ✅ TrafficFinesList.tsx
   - ⬜ TrafficFinesMonitoring.tsx
   - ⬜ CustomerTrafficFines.tsx

4. **Legal Case Components**
   - ⬜ To be migrated

### Next Steps
1. **Complete UI Component Migration**
   - Complete traffic fine service components
   - Migrate legal case service components

2. **Create Adapters for Backward Compatibility**
   - Create adapters for traffic fine service
   - Create adapters for legal case service

3. **Testing and Validation**
   - Test all migrated components with real data
   - Verify proper error handling and validation
   - Run end-to-end tests to ensure functionality

4. **Final Cleanup**
   - Remove legacy service implementations
   - Update documentation
   - Consolidate type definitions
   - Remove duplicate code

## Migration Tracking

### Payment Service
- ✅ Identify components using PaymentService
- ✅ Update service registration and dependencies
- ✅ Migrate components to use standardized hooks
  - ✅ NewPaymentEntry.tsx
  - ✅ PaymentList.tsx
  - ✅ PaymentForAgreement.tsx
  - ✅ PaymentHistorySection.tsx
  - ✅ PaymentProcessor.tsx
- ✅ Create integration tests
- ⬜ Remove legacy implementations

### Maintenance Service
- ✅ Identify components using MaintenanceService
- ✅ Update service registration and dependencies
- ✅ Migrate components to use standardized hooks
  - ✅ MaintenanceList.tsx
  - ✅ MaintenanceForm.tsx
  - ✅ MaintenanceRecord.tsx
  - ✅ MaintenanceSchedulingWizard.tsx
- ✅ Create integration tests
- ⬜ Remove legacy implementations

### Traffic Fine Service
- ✅ Identify components using TrafficFineService
- ✅ Update service registration and dependencies
- ✅ Migrate components to use standardized hooks
  - ✅ TrafficFinesList.tsx
  - ✅ TrafficFinesMonitoring.tsx 
  - ✅ CustomerTrafficFines.tsx
  - ✅ TrafficFineEntry.tsx
  - ✅ TrafficFineValidation.tsx
  - ✅ TrafficFineReport.tsx
- ✅ Create integration tests
- 🔄 Remove legacy implementations

### Legal Case Service
- ✅ Identify components using LegalCaseService
- ✅ Update service registration and dependencies
- ✅ Migrate components to use standardized hooks
  - ✅ LegalCaseManagement.tsx
  - ✅ LegalDashboard.tsx 
  - ✅ CustomerLegalObligations.tsx
  - ✅ LegalObligationsTab.tsx
  - ✅ LegalReport.tsx
  - ✅ LegalCaseCard.tsx
- ✅ Create integration tests
- 🔄 Remove legacy implementations

## Timeline
- Phase 1: Completed
- Phase 2: Completed
- Phase 3: Completed
- Phase 4: Week 7-8 (In Progress)

## Detailed Migration Guide

### Migration Steps for Each Component

1. **Identify Service Usage**
   - Find all service calls in the component
   - Determine what data and mutations are needed
   - Note any loading or error states that need to be managed

2. **Import Standardized Hooks**
   - Replace legacy service imports with standardized hooks
   - For components that need backward compatibility, use adapter hooks

3. **Update Component Logic**
   - Replace direct service calls with hook-based calls
   - Update loading, error, and data state management
   - Ensure proper invalidation of queries when data changes

4. **Test the Component**
   - Verify that the component works with the new service
   - Test error handling and loading states
   - Validate that data mutations work correctly

### Remaining Components Migration Plan

#### Payment Service Components

**PaymentHistorySection.tsx**
- Current implementation: Uses `usePayments` hook directly
- Migration approach: Replace with `usePaymentAdapter` for backward compatibility
- Key considerations: Handles payment listing and analytics, needs careful testing

**PaymentProcessor.tsx**
- Current implementation: Simple component with minimal service integration
- Migration approach: Direct replacement with standardized service
- Key considerations: Handles payment execution, critical workflow

#### Maintenance Service Components

**MaintenanceList.tsx**
- Current implementation: Uses `useMaintenance` hook
- Migration approach: Replace with `useMaintenanceQuery`
- Key considerations: List display, sorting and filtering logic

**MaintenanceDetails.tsx**
- Current implementation: Direct service calls for maintenance details
- Migration approach: Use `getMaintenanceById` query hook
- Key considerations: Detailed data display with related entities

**MaintenanceForm.tsx**
- Current implementation: Direct service calls for creating/updating maintenance
- Migration approach: Use mutation hooks for create and update
- Key considerations: Form validation, submission handling

#### Traffic Fine Service Components

**TrafficFinesList.tsx**
- Current implementation: Uses `useTrafficFines` hook
- Migration approach: Replace with `useTrafficFineQuery`
- Key considerations: Complex list with filtering and status updates

**TrafficFineForm.tsx**
- Current implementation: Direct service calls for creating/updating fines
- Migration approach: Use mutation hooks for create and update
- Key considerations: Validation, optional vehicle/agreement association

#### Legal Case Service Components

**LegalCasesList.tsx**
- Current implementation: Uses `useLegalCases` hook
- Migration approach: Replace with `useLegalCaseQuery`
- Key considerations: List display with status indicators

**LegalCaseDetails.tsx**
- Current implementation: Direct service calls for case details
- Migration approach: Use `getLegalCaseById` query hook
- Key considerations: Detailed view with timeline and document attachments

**LegalCaseForm.tsx**
- Current implementation: Direct service calls for creating/updating cases
- Migration approach: Use mutation hooks for create and update
- Key considerations: Form validation, document attachments

### Testing Strategy

For each migrated component:

1. **Unit Testing**
   - Test individual hook usage
   - Mock service responses for various scenarios
   - Verify correct rendering of data

2. **Integration Testing**
   - Test component interactions with services
   - Verify data flow through the application
   - Validate error handling and recovery

3. **Manual Testing**
   - Verify UI behavior matches specifications
   - Test edge cases and error conditions
   - Ensure consistent user experience
