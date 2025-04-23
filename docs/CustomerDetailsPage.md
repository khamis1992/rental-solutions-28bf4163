
# Customer Details Page Documentation

## Overview
The Customer Details page displays comprehensive information about a customer in the rental management system. It provides a complete view of customer information, including personal details, contact information, rental agreement history, traffic violations, and additional notes.

## Page Structure
The page is divided into several sections:
1. Header section with customer name and actions
2. Contact Information card
3. Customer Details card
4. Agreement History table
5. Traffic Fines section
6. Additional Notes section

## Components and Data Flow

### Page Container
The page is wrapped in the `PageContainer` component that provides:
- Page title ("Customer Details")
- Description ("View detailed information about the customer")
- Back link to the customers list page (`/customers`)

### Customer Data Loading
- Uses `useParams()` hook to get the customer ID from the URL
- Fetches customer data using `useCustomers()` hook's `getCustomer` function
- Implements loading state while data is being fetched
- Handles error state if customer is not found
- Stores customer data in state with `useState`

### Action Buttons
- Edit button: Links to `/customers/edit/${customer.id}`
- Delete button: Opens a confirmation dialog before deletion
- Delete functionality uses `deleteCustomer.mutateAsync()` from `useCustomers` hook

### Contact Information Card
This card displays:
- Email address
- Phone number
- Physical address (with whitespace preserved)

### Customer Details Card
This card shows:
- Status badge (color-coded based on status)
  - Active: green
  - Inactive: outline
  - Blacklisted: red
  - Pending Review: amber
- Driver License number
- Last Updated timestamp

### Agreement History Table
This section displays a table of rental agreements associated with the customer:
- Agreement Number
- Vehicle information (make, model, license plate)
- Start and End dates
- Status as a color-coded badge
- Total Amount (formatted as currency)
- View button to navigate to the agreement detail page
- Uses `useAgreements()` hook with `{ customer_id: id }` parameter
- Shows loading state with `Skeleton` components
- Shows empty state message if no agreements exist

### Traffic Fines Section
Displays traffic violations associated with the customer:
- Uses `CustomerTrafficFines` component
- Passes `customerId` prop to filter fines for this specific customer

### Additional Notes Section
- Displays formatted text notes from the customer record
- Shows placeholder text if no notes exist
- Preserves whitespace formatting

## UI Elements

### Status Badge Variants
- active: success (green)
- inactive: outline (gray)
- blacklisted: destructive (red)
- pending_review: warning (amber)
- pending_payment: secondary (purple)

### Date Formatting
- Created date: Uses `formatDate` utility for standard date format
- Last updated: Uses `formatDateTime` utility for date and time display

### Loading States
- Shows "Loading customer details..." text while fetching data
- Uses `Skeleton` components in agreement history table while loading agreements

### Error States
- Shows error card when customer is not found
- Provides link back to customers list

## Implementation Details

### Required Hooks and Components
- `useParams` from react-router-dom for URL parameter extraction
- `useState`, `useEffect`, `useCallback` from React for state management
- `useCustomers` custom hook for customer data operations
- `useAgreements` custom hook for fetching agreement history
- UI components from the design system:
  - Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter
  - Button
  - Separator
  - Badge
  - Table and related components
  - AlertDialog and related components
  - Skeleton for loading states

### Data Types
The page expects a Customer object with the following properties:
- id: string (UUID)
- full_name: string
- email: string
- phone: string (Qatar phone number format)
- address: string (optional)
- driver_license: string
- nationality: string
- notes: string (optional)
- status: "active" | "inactive" | "blacklisted" | "pending_review" | "pending_payment"
- created_at: string (ISO date)
- updated_at: string (ISO date)

### Icons Used
- Edit (pencil icon)
- Trash2 (trash bin icon)
- UserCog (person with gear icon)
- CalendarClock (calendar with clock icon)
- Clock (clock icon)
- AlertTriangle (warning icon)
- FileText (document icon)

## User Interactions
- **Viewing customer details**: Data loads automatically when the page is accessed
- **Editing a customer**: Click the "Edit" button to navigate to the edit form
- **Deleting a customer**: 
  1. Click "Delete" button
  2. Confirm in the alert dialog
  3. On success, redirected to the customers list page
- **Viewing an agreement**: Click "View" button in the agreement history table
- **Navigating back**: Click the back navigation in the PageContainer header

## Error Handling
- Shows appropriate error messages when customer data cannot be loaded
- Provides user feedback via toast notifications for delete operations
- Handles "not found" scenarios with a dedicated error card

## Accessibility Considerations
- Proper heading hierarchy (h2 for main sections)
- Semantic HTML structure
- Descriptive button text and icons
- Color contrast for status badges
- Keyboard navigable interface

## Related Components
- CustomerTrafficFines: Displays traffic violations for the customer
- PageContainer: Layout wrapper with navigation and title
- Various UI components from the design system

## URL Structure
- Path: `/customers/:id` where `:id` is the UUID of the customer

This documentation provides a comprehensive guide to rebuild the Customer Details page with all its features and functionality.
