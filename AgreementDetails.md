
# Agreement Details Page Documentation

## Overview
The Agreement Details page displays comprehensive information about a rental agreement, including customer information, vehicle details, payment history, traffic fines, and provides functionality for managing the agreement lifecycle.

## Page Structure
The Agreement Details page is structured into several sections:
1. **Header** - Contains agreement ID, status, and action buttons
2. **Main Information** - Displays agreement dates, customer, and vehicle information
3. **Payment History** - Lists all payments made for the agreement
4. **Traffic Fines** - Shows traffic violations associated with this rental
5. **Action Panel** - Offers functionality like printing, extending, or terminating the agreement

## Key Files and Components

### Pages
- `src/pages/AgreementDetailPage.tsx` - Main container component that fetches and displays agreement data

### Components
- `src/components/agreements/AgreementDetail.tsx` - Primary component displaying agreement information
- `src/components/agreements/PaymentHistory.tsx` - Handles payment records display
- `src/components/agreements/PaymentEntryForm.tsx` - Form for adding new payments
- `src/components/agreements/PaymentEditDialog.tsx` - Dialog for editing existing payments
- `src/components/agreements/AgreementTrafficFines.tsx` - Displays traffic violations

### Hooks
- `src/hooks/use-agreements.ts` - Primary hook for agreement-related operations
- `src/hooks/use-traffic-fines.ts` - Hook for fetching traffic fine data
- `src/hooks/use-rent-amount.ts` - Calculates rent based on dates and rates

## Data Flow
1. When the page loads, `useAgreementDetail` hook fetches agreement data using the ID from URL params
2. The data is distributed to child components through props
3. Each child component (payments, fines, etc.) may fetch additional related data
4. Actions performed in child components trigger data mutations
5. The main page refreshes data after mutations to keep the UI updated

## Database Schema
The agreement details page interacts with these database tables:
- `leases` - Primary agreement data
- `payments` - Payment records for agreements
- `traffic_fines` - Traffic violation records
- `vehicles` - Vehicle information
- `profiles` - Customer information

## Key Features

### Date Handling
The agreement system handles various dates:
- **Start Date** - When the agreement begins
- **End Date** - Expected return date
- **Actual Return Date** - When vehicle was actually returned
- **Payment Date** - When payments were recorded

Dates are stored in ISO format in the database but displayed in localized format in the UI.

### Payment Processing
The payment system:
- Calculates remaining balance
- Tracks payment history
- Allows adding new payments
- Supports editing existing payments
- Validates payment amounts

### Traffic Fines Integration
The traffic fines system:
- Links violations to specific agreements
- Shows dates, amounts, and status of fines
- Provides functionality to mark fines as paid
- Calculates totals for reporting

### PDF Generation
Agreement details can be exported to PDF using:
- `AgreementToPdf` functionality
- Customizable templates
- Complete agreement data

## Common Issues and Troubleshooting

### Date Formatting Issues
If dates display incorrectly:
- Check date format conversion in `useAgreementDetail` hook
- Verify date handling in components like `AgreementDetail`
- Ensure proper date formatting when saving to database

### Missing or Incorrect Data
If data appears missing:
- Verify the agreement ID in the URL
- Check database queries in `use-agreements.ts`
- Confirm related data exists (vehicle, customer records)
- Look for console errors indicating failed requests

### Payment Calculation Errors
If payment amounts display incorrectly:
- Check `use-rent-amount.ts` for calculation logic
- Verify payment history is complete
- Ensure rate calculations match business rules

## Code Example: Fetching Agreement Details

```typescript
// From use-agreements.ts
export function useAgreementDetail(id: string) {
  return useQuery({
    queryKey: ['agreement', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            profiles:customer_id(*),
            vehicles:vehicle_id(*)
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Transform dates to proper format
        const transformedData = {
          ...data,
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          actual_return_date: data.actual_return_date ? new Date(data.actual_return_date) : null,
        };
        
        return transformedData;
      } catch (error) {
        console.error('Error fetching agreement:', error);
        throw error;
      }
    }
  });
}
```

## Integration Points
The Agreement Details page integrates with:
1. **Customer Management** - Linking to customer profiles
2. **Vehicle Management** - Showing vehicle details and status
3. **Financial System** - Processing payments
4. **Reporting System** - Providing data for reports
5. **Legal Management** - Tracking traffic fines and violations

## Performance Considerations
To ensure optimal performance:
1. Implement proper caching with React Query
2. Use pagination for large payment histories
3. Optimize database queries to fetch only needed fields
4. Implement error boundaries to prevent cascading failures

## Security Considerations
The Agreement Details page implements:
1. Role-based access control
2. Input validation for payment amounts
3. Data sanitization for user inputs
4. Proper error handling to prevent information disclosure

## Configuration
The Agreement Details functionality can be configured through:
1. Business rules in `use-rent-amount.ts`
2. Display options in components
3. PDF export templates

## Business Rules
1. **Late Return Fees** - Applied when a vehicle is returned after the agreed end date
2. **Extension Fees** - Applied when an agreement is extended
3. **Payment Allocation** - How payments are allocated to different fee types
4. **Status Changes** - Rules for when agreement status changes

## Recommended Development Practices
1. Test all calculations with different date ranges
2. Verify payment totals manually
3. Test edge cases like same-day returns
4. Ensure proper error handling for all API calls
5. Maintain clear separation between UI and business logic
