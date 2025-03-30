
# Agreement Details Page Documentation

## Overview
The Agreement Details page is the central hub for managing individual rental agreements. It provides a comprehensive view of each agreement's information, payment history, and associated traffic fines, while offering tools for agreement lifecycle management.

## Page Architecture
The Agreement Details page is composed of several key components:
1. **AgreementDetailPage.tsx** - Container component that fetches data and manages state
2. **AgreementDetail.tsx** - Main presentation component with all UI elements
3. **PaymentHistory.tsx** - Payment tracking and management
4. **AgreementTrafficFines.tsx** - Traffic violations tracking
5. **PaymentEntryForm.tsx** - Form for recording new payments

## Features and Functionality

### 1. Header Information
- **Agreement Number Display** - Shows the unique agreement identifier at the top of the page
- **Creation Date** - Displays when the agreement was first created
- **Status Badge** - Color-coded status indicator (Active, Expired, Cancelled, Draft, Pending, or Closed)

### 2. Customer Information Card
- **Full Name** - Customer's complete name
- **Email** - Primary contact email
- **Phone** - Contact phone number
- **Other Details** - Any additional customer information stored in the system

### 3. Vehicle Information Card
- **Vehicle Details** - Make, model, and year of the rented vehicle
- **License Plate** - Vehicle's registration number
- **Color** - Vehicle's exterior color
- **Additional Specifications** - Any other relevant vehicle information

### 4. Agreement Details Card
- **Rental Period** - Start and end dates of the agreement
- **Duration** - Total rental period in months (calculated automatically)
- **Monthly Rent Amount** - The recurring monthly payment amount
- **Total Contract Amount** - Calculated total value (Monthly rent × Duration)
- **Deposit Amount** - Security deposit collected from the customer
- **Daily Late Fee** - Amount charged per day for late payments
- **Terms Acceptance** - Indication if terms were accepted by the customer
- **Signature Status** - Whether the agreement has been signed
- **Additional Drivers** - List of authorized additional drivers
- **Notes** - Special terms, conditions, or comments about the agreement

### 5. Payment Management
- **Payment History** - Chronological list of all payments made against the agreement
- **Payment Recording** - Interface to add new payment transactions
- **Payment Editing** - Ability to modify existing payment records
- **Payment Deletion** - Option to remove incorrect payment entries
- **Financial Summary** - Shows total paid, total due, and remaining balance

### 6. Traffic Fines Tracking
- **Violation List** - Shows all traffic violations associated with the agreement
- **Fine Details** - Information about each violation including date, location, and amount
- **Payment Status** - Indicates whether fines have been paid, disputed, or are pending

### 7. Document Management
- **PDF Generation** - Functionality to create and download a PDF copy of the agreement
- **Print Option** - Ability to print the agreement directly

## Button Actions

### Primary Actions
1. **Edit Button**
   - **Label**: "Edit"
   - **Icon**: Edit/Pencil icon
   - **Action**: Navigates to the agreement edit page
   - **Behavior**: Redirects to `/agreements/edit/{agreement.id}` and displays a toast notification

2. **Print Button**
   - **Label**: "Print"
   - **Icon**: FileText icon
   - **Action**: Initiates printing of the agreement
   - **Behavior**: Currently shows a toast indicating future implementation

3. **Download PDF Button**
   - **Label**: "Download PDF"
   - **Icon**: Download icon
   - **Action**: Generates and downloads a PDF document of the agreement
   - **Behavior**: Shows loading state during generation and success/error toasts upon completion

4. **Record Payment Button**
   - **Label**: "Record Payment"
   - **Icon**: None (text-only button)
   - **Action**: Opens the payment entry dialog
   - **Behavior**: Displays a modal with a form for recording a new payment

5. **Delete Button**
   - **Label**: "Delete"
   - **Icon**: Trash2 icon
   - **Action**: Initiates agreement deletion with confirmation
   - **Behavior**: Shows a confirmation dialog before permanently removing the agreement

### Payment Actions
1. **Edit Payment Button**
   - **Label**: Icon only (Pencil)
   - **Action**: Opens the payment edit dialog
   - **Behavior**: Displays a modal with form for editing existing payment details

2. **Delete Payment Button**
   - **Label**: Icon only (Trash2)
   - **Action**: Initiates payment deletion with confirmation
   - **Behavior**: Shows a confirmation dialog before permanently removing the payment record

## Implementation Details

### Data Fetching
The page fetches agreement data when mounted using the agreement ID from URL parameters:

```typescript
useEffect(() => {
  const fetchAgreement = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // First get the agreement
      const data = await getAgreement(id);
      
      if (data) {
        // Get the rent_amount directly from the leases table
        try {
          const { data: leaseData, error: leaseError } = await supabase
            .from("leases")
            .select("rent_amount, daily_late_fee")
            .eq("id", id)
            .single();
          
          if (!leaseError && leaseData) {
            // Update rent amount if available
            if (leaseData.rent_amount) {
              data.total_amount = leaseData.rent_amount;
              setRentAmount(leaseData.rent_amount);
              
              // Calculate contract amount = rent_amount * duration in months
              if (data.start_date && data.end_date) {
                const durationMonths = differenceInMonths(new Date(data.end_date), new Date(data.start_date));
                const calculatedContractAmount = leaseData.rent_amount * (durationMonths || 1);
                setContractAmount(calculatedContractAmount);
              }
            }
            
            // Update daily late fee if available
            if (leaseData.daily_late_fee) {
              data.daily_late_fee = leaseData.daily_late_fee;
            }
          }
        } catch (err) {
          console.error("Error fetching lease data:", err);
        }
        
        setAgreement(data);
      } else {
        toast.error("Agreement not found");
        navigate("/agreements");
      }
    } catch (error) {
      console.error("Error fetching agreement:", error);
      toast.error("Failed to load agreement details");
      navigate("/agreements");
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  if (!hasAttemptedFetch || refreshTrigger > 0) {
    fetchAgreement();
  }
}, [id, getAgreement, navigate, hasAttemptedFetch, refreshTrigger]);
```

### Payment Processing
The payment recording functionality uses a modal dialog with a form to capture payment details:

```typescript
const handleOpenPaymentDialog = () => {
  setIsPaymentDialogOpen(true);
};

const handlePaymentComplete = async () => {
  setIsPaymentDialogOpen(false);
  await fetchPayments();
  toast.success("Payment recorded successfully");
};

// In the render section:
<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
  <DialogTrigger asChild>
    <Button variant="default" onClick={handleOpenPaymentDialog}>
      Record Payment
    </Button>
  </DialogTrigger>
  <DialogContent className="max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Record New Payment</DialogTitle>
      <DialogDescription>
        Enter the payment details for agreement {agreement.agreement_number}
      </DialogDescription>
    </DialogHeader>
    <PaymentEntryForm 
      agreementId={agreement.id} 
      onPaymentComplete={handlePaymentComplete} 
      defaultAmount={localRentAmount}
    />
  </DialogContent>
</Dialog>
```

### PDF Generation
The agreement can be exported as a PDF document:

```typescript
const handleDownloadAgreement = async () => {
  setIsGeneratingPdf(true);
  try {
    console.log("Generating PDF for agreement:", agreement);
    
    toast.info("Preparing agreement PDF document...");
    
    const success = await generatePdfDocument(agreement);
    
    if (success) {
      toast.success("Agreement downloaded as PDF");
    } else {
      toast.error("Failed to generate PDF document");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF document: " + (error instanceof Error ? error.message : String(error)));
  } finally {
    setIsGeneratingPdf(false);
  }
};

// In the render section:
<Button 
  variant="outline" 
  onClick={handleDownloadAgreement}
  disabled={isGeneratingPdf}
>
  <Download className="mr-2 h-4 w-4" />
  {isGeneratingPdf ? "Generating..." : "Download PDF"}
</Button>
```

### Payment History
The payment history section displays all transactions and calculates financial status:

```typescript
const getTotalPaid = () => {
  return payments.reduce((total, payment) => total + payment.amount, 0);
};

const calculateTotalDue = () => {
  if (!rentAmount || !leaseStartDate || !leaseEndDate) return 0;
  
  const months = Math.max(1, Math.ceil(
    (leaseEndDate.getTime() - leaseStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  ));
  
  return rentAmount * months;
};

const totalPaid = getTotalPaid();
const totalDue = calculateTotalDue();
const remainingBalance = totalDue - totalPaid;

// In the render section:
<div className="flex flex-col items-start sm:items-end space-y-1">
  <div className="flex items-center space-x-2">
    <span className="text-sm font-medium">Total Paid:</span>
    <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
  </div>
  {rentAmount && leaseStartDate && leaseEndDate && (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Total Due:</span>
        <span className="font-bold">{formatCurrency(totalDue)}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Remaining Balance:</span>
        <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(remainingBalance)}
        </span>
      </div>
    </>
  )}
</div>
```

### Traffic Fines Integration
The page fetches and displays traffic violations associated with the agreement:

```typescript
useEffect(() => {
  const fetchTrafficFines = async () => {
    setIsLoading(true);
    
    try {
      // Get the vehicle ID associated with this agreement
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('vehicle_id')
        .eq('id', agreementId)
        .single();
      
      if (leaseError) {
        console.error("Error fetching lease info:", leaseError);
        setIsLoading(false);
        return;
      }

      if (!leaseData?.vehicle_id) {
        console.error("No vehicle associated with this agreement");
        setIsLoading(false);
        return;
      }

      // Fetch traffic fines that are directly associated with this agreement
      const { data: directFines, error: directError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementId);

      if (directError) {
        console.error("Error fetching direct traffic fines:", directError);
      }

      // Fetch traffic fines for the vehicle during the rental period
      const { data: dateRangeFines, error: dateRangeError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('vehicle_id', leaseData.vehicle_id)
        .gte('violation_date', startDate.toISOString())
        .lte('violation_date', endDate.toISOString());

      if (dateRangeError) {
        console.error("Error fetching date range traffic fines:", dateRangeError);
        toast.error("Failed to load traffic fines data");
        setIsLoading(false);
        return;
      }

      // Combine both sets and remove duplicates
      let allFines: TrafficFine[] = [];
      
      // Process and merge both direct and date-range fines
      
      setTrafficFines(allFines);
    } catch (error) {
      console.error("Unexpected error fetching traffic fines:", error);
      toast.error("An error occurred while loading traffic fines");
    } finally {
      setIsLoading(false);
    }
  };

  fetchTrafficFines();
}, [agreementId, startDate, endDate]);
```

## Data Models

### Agreement Object
The primary data structure that holds all agreement information:

```typescript
interface Agreement {
  id: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_number: string;
  start_date: Date;
  end_date: Date;
  total_amount: number;
  deposit_amount?: number;
  daily_late_fee?: number;
  status: AgreementStatus;
  notes?: string;
  additional_drivers?: string[];
  terms_accepted?: boolean;
  signature_url?: string;
  created_at?: Date;
  customers?: Customer;
  vehicles?: Vehicle;
}

enum AgreementStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  DRAFT = "draft",
  PENDING = "pending",
  CLOSED = "closed"
}
```

### Payment Object
Represents a single payment transaction:

```typescript
type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
};
```

### Traffic Fine Object
Represents a single traffic violation:

```typescript
type TrafficFine = {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: string;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  lease_id?: string;
  vehicle_id?: string;
};

enum TrafficFineStatusType {
  PAID = "paid",
  PENDING = "pending",
  DISPUTED = "disputed"
}
```

## User Workflows

### Viewing Agreement Details
1. User navigates to `/agreements/{agreementId}`
2. System fetches agreement data, payment history, and related traffic fines
3. Page displays all information in organized sections

### Recording a Payment
1. User clicks "Record Payment" button
2. Payment entry dialog opens
3. User enters payment amount, date, method, and optional details
4. User submits the form
5. System records the payment and updates the payment history
6. Success notification is displayed

### Editing an Agreement
1. User clicks "Edit" button
2. System navigates to `/agreements/edit/{agreementId}`
3. User makes changes to the agreement in the edit form
4. User saves changes
5. System updates the agreement and returns to the details page

### Downloading Agreement as PDF
1. User clicks "Download PDF" button
2. System generates a PDF document with all agreement details
3. PDF is downloaded to the user's device
4. Success notification is displayed

### Deleting an Agreement
1. User clicks "Delete" button
2. Confirmation dialog appears
3. User confirms deletion
4. System removes the agreement from the database
5. User is redirected to the agreements list page
6. Success notification is displayed

## Error Handling
The page implements comprehensive error handling:
- Failed data fetching shows error notifications
- Non-existent agreements redirect to the listings page
- PDF generation errors display detailed error messages
- Payment recording/editing failures show appropriate error messages
- Network errors are caught and displayed to the user

## Responsive Design
The Agreement Details page is fully responsive:
- On large screens, information is displayed in a multi-column layout
- On medium screens, some sections collapse to a single column
- On small/mobile screens, all sections stack vertically
- Modal dialogs are scrollable on smaller screens with a maximum height

## Performance Considerations
- Data is fetched only when needed using state tracking
- Payment history uses optimized queries with pagination when appropriate
- PDF generation happens asynchronously without blocking the UI
- Large data sets are processed in batches to maintain responsiveness

## Security
- Agreement access is restricted to authenticated users
- The page checks for authorization to view the specific agreement
- Sensitive data is appropriately protected and masked when necessary
- Operations like deletion require explicit confirmation
