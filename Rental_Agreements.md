
# Rental Agreements Module

## Overview
The Rental Agreements module manages all aspects of vehicle rental contracts, including creation, modification, payment tracking, and lifecycle management.

## Key Components

### Agreement Detail Page
Displays comprehensive information about a specific rental agreement:
- Customer information
- Vehicle details
- Contract terms
- Payment history
- Traffic fines

### Initialization Pattern
To prevent infinite re-renders and ensure data consistency:
1. System is initialized once using `useAgreementInitialization` hook
2. All subsequent data fetching depends on the initialization state
3. References (useRef) track fetch attempts to prevent duplicate calls

### Data Flow
```
┌─────────────────┐        ┌───────────────────┐        ┌───────────────────┐
│ Initialization  │───────▶│ Agreement Data    │───────▶│ Payment Data      │
│ useRef tracking │        │ Single fetch      │        │ Based on agreement│
└─────────────────┘        └───────────────────┘        └───────────────────┘
```

### Special Agreement Handling
For agreements requiring custom logic (like MR202462):
- Run once after initialization is complete
- Use reference tracking to prevent duplicate runs
- Maintain proper cleanup in useEffect to prevent memory leaks

## Best Practices
1. Always use reference (useRef) tracking for one-time operations
2. Implement proper cleanup functions in useEffect hooks
3. Separate concerns into individual hooks for maintainability
4. Use callbacks for functions passed down to child components
5. Keep refreshing logic isolated using a trigger pattern

## Refresh Pattern
```
┌─────────────────┐        ┌───────────────────┐        
│ Refresh Trigger │───────▶│ Targeted Refresh  │        
│ State increment │        │ Only what changed │        
└─────────────────┘        └───────────────────┘        
```

## Troubleshooting
If you experience infinite re-renders or continuous page refreshes:
1. Check for circular dependencies in useEffect hooks
2. Verify proper useRef tracking for one-time operations
3. Ensure isMounted flags are used for asynchronous operations
4. Confirm proper cleanup in useEffect return functions
5. Validate dependency arrays in useEffect and useCallback hooks
