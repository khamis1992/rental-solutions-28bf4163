
# Vehicle Maintenance System Documentation

## Overview
The Vehicle Maintenance system manages scheduled and unscheduled maintenance for all vehicles in the fleet. It tracks service history, upcoming maintenance needs, and maintenance costs to ensure vehicles remain in optimal operating condition.

## Data Structure

### Main Tables
- `maintenance`: Stores all maintenance records
- `maintenance_categories`: Categorizes different types of maintenance
- `maintenance_tasks`: Specific maintenance tasks assigned to vehicles
- `maintenance_documents`: Documents related to maintenance (receipts, reports)
- `parts_inventory`: Inventory of vehicle parts
- `vehicle_parts`: Parts associated with specific vehicles/maintenance records
- `vehicle_inspections`: Pre/post-rental inspections that may trigger maintenance

### Key Relationships
- Maintenance records are linked to vehicles via `vehicle_id`
- Maintenance records may be associated with categories
- Maintenance may be linked to specific parts from inventory
- Inspections may trigger maintenance tasks

## Components Structure

### Main Components
1. **MaintenanceList** (`src/components/maintenance/MaintenanceList.tsx`)
   - Displays all maintenance records with filtering and sorting
   - Entry point for maintenance management

2. **MaintenanceForm** (`src/components/maintenance/MaintenanceForm.tsx`)
   - Form for creating/editing maintenance records
   - Handles validation and submission

3. **MaintenanceReport** (`src/components/reports/MaintenanceReport.tsx`)
   - Summary reports of maintenance costs and activities

### Supporting Components
- Vehicle selection controls
- Date range pickers
- Status filters
- Cost calculators

## Data Management

### Custom Hooks
The primary hook for maintenance data management is:

```typescript
// src/hooks/use-maintenance.ts
export function useMaintenance() {
  // Fetches and manages maintenance data
  // Handles CRUD operations for maintenance records
  // Provides filtering and search functionality
}
```

### API Endpoints
Maintenance data is managed through Supabase RPC calls and direct table operations:

1. Fetching maintenance records:
   ```typescript
   const { data, error } = await supabase
     .from('maintenance')
     .select('*, vehicle:vehicles(*), category:maintenance_categories(*)')
   ```

2. Creating/updating records:
   ```typescript
   const { data, error } = await supabase
     .from('maintenance')
     .insert(maintenanceData)
   ```

3. Filtering by status, date range, vehicle:
   ```typescript
   const { data, error } = await supabase
     .from('maintenance')
     .select('*')
     .eq('status', status)
     .gte('scheduled_date', startDate)
     .lte('scheduled_date', endDate)
   ```

## Workflow

1. **Scheduled Maintenance**:
   - System identifies vehicles due for maintenance based on mileage or time
   - Maintenance tasks are created and assigned
   - Staff receive notifications of pending maintenance
   - Once completed, records are updated with costs and notes

2. **Unscheduled Maintenance**:
   - Triggered by vehicle inspections or reported issues
   - Maintenance records created with priority levels
   - Parts allocation from inventory
   - Completion tracking

3. **Cost Tracking**:
   - All maintenance costs logged by category
   - Parts usage tracked from inventory
   - Reports generated for management review

## Common Issues and Fixes

### Issue: Maintenance Status Not Updating
**Cause**: Status update function may not be completing due to validation errors.
**Fix**: Ensure all required fields are provided when updating status:

```typescript
// Required fields for status update
const requiredFields = {
  completed_date: new Date(),
  performed_by: currentUserId,
  cost: formData.cost // Must not be null for 'completed' status
};
```

### Issue: Parts Inventory Not Syncing
**Cause**: Transaction may be failing in parts allocation.
**Fix**: Ensure parts transaction is handled in a single operation:

```typescript
// Wrap in a single transaction
const { data, error } = await supabase.rpc('allocate_parts_to_maintenance', {
  maintenance_id: id,
  parts_data: selectedParts
});
```

### Issue: Maintenance Report Data Incorrect
**Cause**: Date range filters may be using incorrect timezone handling.
**Fix**: Ensure consistent date handling across queries:

```typescript
// Convert to UTC for consistent querying
const startDateUTC = new Date(startDate).toISOString();
const endDateUTC = new Date(endDate).toISOString();
```

## Integration Points

### 1. Vehicle System Integration
Maintenance directly relates to vehicle records, updating:
- Vehicle status (available, in maintenance)
- Mileage tracking
- Maintenance history

### 2. Parts Inventory Integration
- Parts usage in maintenance reduces inventory
- Low stock triggers reorder notifications
- Usage history aids in parts forecasting

### 3. Financial System Integration
- Maintenance costs feed into expense tracking
- Budget allocation for maintenance
- Cost per vehicle reporting

### 4. Scheduling System Integration
- Maintenance scheduling impacts vehicle availability
- Coordinates with rental schedule to minimize disruption
- Sends notifications to relevant staff

## Maintenance Predictions

The system includes predictive maintenance capabilities:

```typescript
// Predictive maintenance recommendation algorithm
const predictedIssues = calculatePredictedMaintenance(
  vehicleData,
  maintenanceHistory,
  vehicleUsagePattern
);
```

These predictions help in proactive maintenance scheduling, reducing unexpected downtime, and optimizing the fleet's operational efficiency.

## Testing and Validation

Key maintenance workflows have automated tests:

1. Creating maintenance records
2. Updating maintenance status
3. Parts allocation
4. Cost calculation

Test suite location: `src/tests/maintenance/`

## Configuration Parameters

Maintenance intervals and thresholds are configurable:

```typescript
// Default configuration
const maintenanceConfig = {
  mileageInterval: 5000, // Service every 5000 km
  timeInterval: 90, // Service every 90 days
  inspectionTriggers: ['damage', 'performance_issue'],
  notificationThreshold: 7 // Days before scheduled maintenance
};
```

These parameters can be adjusted in the system settings to match specific fleet requirements.
