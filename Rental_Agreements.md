# Rental Agreements System Documentation

## Overview
The Rental Agreements system handles the full lifecycle of vehicle rental contracts between customers and the company. It manages agreement creation, payment tracking, document generation, and contract termination processes.

## Data Structure

### Primary Tables
- `leases`: The main table storing all rental agreement data
- `unified_payments`: Tracks all payments related to agreements
- `security_deposits`: Manages security deposits for agreements
- `agreement_documents`: Stores documents related to agreements
- `agreement_templates`: Templates for generating agreement documents
- `damages`: Records any damages reported during the rental period
- `penalties`: Tracks late fees and other penalties

### Key Relationships
- Agreements are linked to customers via `customer_id`
- Agreements are linked to vehicles via `vehicle_id`
- Payments are linked to agreements via `lease_id`
- Documents are linked to agreements via `lease_id`

## Components Structure

### Main Components
1. **AgreementList** (`src/components/agreements/AgreementList.tsx`)
   - Main listing of all agreements with filtering capabilities
   - Entry point for agreement management

2. **AgreementForm** (`src/components/agreements/AgreementForm.tsx`)
   - Form for creating and editing agreements
   - Handles customer and vehicle selection
   - Calculates pricing based on duration and vehicle type

3. **AgreementDetail** (`src/components/agreements/AgreementDetail.tsx`)
   - Detailed view of a single agreement
   - Shows payment history, document links, and status

4. **PaymentHistory** (`src/components/agreements/PaymentHistory.tsx`)
   - Displays payment records for an agreement
   - Allows recording new payments

5. **PaymentEntryForm** (`src/components/agreements/PaymentEntryForm.tsx`)
   - Form for recording new payments against an agreement

6. **PaymentEditDialog** (`src/components/agreements/PaymentEditDialog.tsx`)
   - Dialog for editing existing payment records

### Supporting Components
- Document viewers
- Status badges
- Payment status indicators
- Due date calculators

## Data Management

### Custom Hooks
The primary hook for agreement data management is:

```typescript
// src/hooks/use-agreements.ts
export function useAgreements(initialFilters = {}) {
  // Fetches and manages agreement data
  // Provides filtering and search functionality
  // Handles CRUD operations for agreements
}
```

For payments management:

```typescript
// Within use-agreements.ts
const getAgreement = async (id: string): Promise<Agreement | null> => {
  // Fetches a single agreement with all related data
}

const createAgreement = useApiMutation(
  async (agreement: Omit<Agreement, 'id'>) => {
    // Creates a new agreement record
  }
)

const updateAgreement = useApiMutation(
  async ({ id, data }: { id: string, data: Partial<Agreement> }) => {
    // Updates an existing agreement
  }
)
```

### API Endpoints
Agreement data is managed through Supabase with these key operations:

1. Fetching agreements with related data:
   ```typescript
   const { data, error } = await supabase
     .from('leases')
     .select(`
       *,
       customers:profiles(*),
       vehicles(*)
     `)
   ```

2. Creating agreements:
   ```typescript
   const { data, error } = await supabase
     .from('leases')
     .insert(agreementData)
     .select()
   ```

3. Recording payments:
   ```typescript
   const { data, error } = await supabase
     .from('unified_payments')
     .insert({
       lease_id: agreementId,
       amount: amount,
       payment_date: new Date().toISOString(),
       status: 'paid'
     })
   ```

## Workflows

1. **Agreement Creation**:
   - Select customer and vehicle
   - Define rental period and pricing
   - Calculate total amount and deposit
   - Generate agreement document
   - Collect initial payment
   - Change agreement and vehicle status

2. **Payment Processing**:
   - Record regular payments
   - Track payment status
   - Calculate late fees if applicable
   - Update balance and payment history

3. **Agreement Termination**:
   - Vehicle inspection
   - Final payment calculation
   - Security deposit refund processing
   - Status updates for agreement and vehicle

## Payment Scheduling

The system automatically generates payment schedules based on agreement terms:

```typescript
// Function for generating monthly payments
export const generateMonthlyPayment = async (
  supabase,
  agreementId,
  amount,
  month,
  year
) => {
  // Creates pending payment records for scheduled payments
}
```

## Common Issues and Fixes

### Issue: Agreements List Not Loading
**Cause**: Complex query structure may timeout or hit rate limits.
**Fix**: 
- Optimize the query with proper indexes
- Implement pagination
- Reduce the data fetched in initial load

### Issue: Agreement Status Not Updating
**Cause**: Status update may be failing due to dependencies or validation.
**Fix**:
```typescript
// Ensure all related records are updated in a transaction
const { data, error } = await supabase.rpc('update_agreement_status', {
  agreement_id: id,
  new_status: status,
  update_vehicle: true
});
```

### Issue: Payment Records Not Showing
**Cause**: Payment association to lease may be missing or incorrect.
**Fix**:
1. Check lease_id on payment records
2. Ensure correct ID type (UUID)
3. Verify payment filters are not excluding valid records

```typescript
// Verify payment association
const { data, error } = await supabase
  .from('unified_payments')
  .select('*')
  .eq('lease_id', agreementId);
  
console.log('Payments found:', data?.length, 'Error:', error);
```

### Issue: Duplicate Payment Generation
**Cause**: Payment generation logic may run multiple times for the same period.
**Fix**:
```typescript
// Add check for existing payments before creating new ones
const { data: existingPayments } = await supabase
  .from('unified_payments')
  .select('id')
  .eq('lease_id', agreementId)
  .gte('payment_date', startOfMonth.toISOString())
  .lt('payment_date', endOfMonth.toISOString());

if (existingPayments && existingPayments.length > 0) {
  console.log('Payment already exists for this month');
  return { success: false, message: 'Payment already exists for this month' };
}
```

## Integration Points

### 1. Customer System Integration
- Customer details are pulled for agreement creation
- Customer payment history affects agreement terms
- Agreement status updates customer records

### 2. Vehicle System Integration
- Vehicle availability checked during agreement creation
- Vehicle status updated based on agreement status
- Vehicle history updated after agreement completion

### 3. Payment System Integration
- Payments from agreements feed into financial reports
- Late payment tracking triggers notifications
- Security deposit handling links to payment processing

### 4. Document Generation Integration
- Agreement templates used for document generation
- Signed documents stored and linked to agreements
- Documents accessible for printing and sharing

## Document Generation

Agreement documents are generated using templates:

```typescript
// Process agreement template with dynamic values
export const processAgreementTemplate = (templateText: string, data: any): string => {
  // Replace placeholders with actual data
  let processedTemplate = templateText;
  
  // Customer data replacements
  if (data.customer_data) {
    processedTemplate = processedTemplate
      .replace(/\{\{CUSTOMER_NAME\}\}/g, data.customer_data.full_name || '')
      // ... more replacements
  }
  
  // Vehicle data replacements
  // Agreement data replacements
  
  return processedTemplate;
};
```

## Search Optimization

The system includes specialized search functionality for license plates and agreement numbers:

```typescript
// Helper for license plate matching
export const doesLicensePlateMatchNumeric = (
  plate: string, 
  searchPattern: string
): boolean => {
  // Various matching strategies for better user experience
}
```

## Testing and Validation

Key agreement workflows have validation rules:

```typescript
// Agreement validation schema
export const agreementSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  vehicle_id: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum([/* status values */]),
  // ... other fields
});
```

## Pending Features and Enhancements

1. **Automatic Late Fee Application**:
   - System to automatically calculate and apply late fees
   - Configurable grace periods and fee structures

2. **Payment Receipt Generation**:
   - Automatic PDF receipt generation for payments
   - Email distribution of receipts

3. **Agreement Extension Process**:
   - Streamlined workflow for extending existing agreements
   - Recalculation of payment schedules

4. **Early Termination Handling**:
   - Rules for calculating early termination fees
   - Refund processing for prepaid amounts

## Troubleshooting Flow

When diagnosing issues with agreements:

1. Verify the agreement exists and has correct IDs
2. Check related vehicle and customer records
3. Examine payment records for the agreement
4. Verify document generation status
5. Check status transition history
6. Review any transaction logs for errors

## Configuration Options

Agreement settings can be customized:

```typescript
// Default configuration parameters
const agreementConfig = {
  defaultLateFee: 120.0, // Daily late fee amount
  securityDepositMultiplier: 1.0, // Multiplier of monthly rent
  minRentalDuration: 7, // Minimum rental period in days
  paymentGracePeriod: 3, // Days after due date before late fee
  documentRetentionPeriod: 365 // Days to retain documents
};
```

These parameters influence agreement calculation, payment scheduling, and document handling throughout the system.
