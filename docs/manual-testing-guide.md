# Manual Testing Guide for Service Migration

This guide provides detailed steps to manually test all functionality after the service migration to ensure everything works correctly.

## Prerequisites

1. Start the application:
```
cd "c:\Users\khamis\coodebase rental\rental-solutions-28bf4163"
npm run dev
```

2. Make sure you have valid login credentials to access the system

## 1. Data Fetching with Loading States

### Traffic Fines List
- [ ] Navigate to Traffic Fines section
- [ ] Verify loading spinner appears before data loads
- [ ] Confirm data loads successfully and displays correctly
- [ ] Check that filter operations maintain proper loading states

### Legal Cases List
- [ ] Navigate to Legal Cases section
- [ ] Verify loading spinner appears before data loads
- [ ] Confirm data loads successfully and displays in proper format
- [ ] Verify that sorting and filtering maintain proper loading states

### Caching Behavior
- [ ] Navigate to Traffic Fines section
- [ ] Navigate away to another section
- [ ] Return to Traffic Fines section and observe immediate data display (from cache)
- [ ] Repeat for Legal Cases section

## 2. Error Handling

### Form Validation Errors
- [ ] Go to TrafficFineEntry component
- [ ] Try submitting without filling required fields
- [ ] Verify error messages appear for each invalid field
- [ ] Try submitting with invalid data (e.g., negative fine amount)
- [ ] Verify validation prevents submission with proper error message

### Network Errors
- [ ] Turn off network connection
- [ ] Try loading Traffic Fines list
- [ ] Verify appropriate error message is displayed
- [ ] Try submitting a new traffic fine
- [ ] Verify network error is handled gracefully
- [ ] Turn network back on and verify recovery

### API Errors
- [ ] Try to access a non-existent traffic fine ID
- [ ] Verify not found error is handled properly
- [ ] Try to access a non-existent legal case
- [ ] Verify error boundary catches and displays user-friendly message

## 3. Mutation Operations

### Create
- [ ] Use TrafficFineEntry to create a new traffic fine
- [ ] Verify success message appears
- [ ] Confirm new fine appears in the Traffic Fines list
- [ ] Create a new legal case
- [ ] Verify it appears in the Legal Cases list

### Update
- [ ] Find an existing traffic fine
- [ ] Update its status (pay or dispute)
- [ ] Verify status change is reflected immediately
- [ ] Update a legal case status
- [ ] Verify status change is reflected correctly

### Delete
- [ ] Delete a traffic fine
- [ ] Verify success message appears
- [ ] Confirm fine is removed from the list
- [ ] Delete a legal case
- [ ] Verify it disappears from the list

## 4. Component Integration

### Report Pages
- [ ] Navigate to Reports.tsx
- [ ] Verify traffic fine data loads correctly in reports
- [ ] Check that legal case data integrates properly
- [ ] Verify filtering affects displayed report data

### Cross-Component Communication
- [ ] Create a new traffic fine for a specific vehicle
- [ ] Navigate to vehicle details and verify fine appears
- [ ] Update a legal case status
- [ ] Verify status update appears in all related components

### Customer-Related Views
- [ ] Use TrafficFineValidation.tsx to assign a fine to a customer
- [ ] Navigate to customer profile and verify fine appears
- [ ] Add a legal case for a customer
- [ ] Verify it appears in CustomerLegalObligations component

### Agreement-Specific Views
- [ ] Check AgreementTrafficFines shows only fines for a specific agreement
- [ ] Create a new fine linked to an agreement
- [ ] Verify it appears in agreement-specific view
- [ ] Check that filters work correctly within agreement context

## 5. Edge Cases

### Empty States
- [ ] Clear or filter data to get empty results
- [ ] Verify empty state UI is displayed correctly
- [ ] Check that proper messaging guides the user

### Concurrent Operations
- [ ] Try creating multiple traffic fines quickly
- [ ] Verify all operations complete successfully
- [ ] Try updating multiple legal cases simultaneously
- [ ] Check for race conditions or data corruption

### Permission-Based Functionality
- [ ] If applicable, test with different user roles
- [ ] Verify appropriate functionality is available based on permissions

## Testing Completion
- [ ] Document any issues found during testing
- [ ] File bug reports for any failures
- [ ] Mark the migration as complete if all tests pass
