
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
6. **PaymentEntryDialog.tsx** - Dialog component for the payment entry form

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

### 5. Payment History Card
The Payment History card provides a comprehensive view of all payments associated with the agreement and allows for payment management. This component is implemented in `PaymentList.tsx`.

#### Card Structure
```tsx
<Card className="mt-8">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-base font-medium">Payment History</CardTitle>
        <CardDescription>View and manage payment records</CardDescription>
      </div>
      {rentAmount && agreement.status.toLowerCase() === 'active' && (
        <div className="flex items-center">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Missing 1 payment
          </Badge>
        </div>
      )}
    </div>
  </CardHeader>
  <CardContent className="pt-0">
    <PaymentList 
      agreementId={agreement.id} 
      onPaymentDeleted={onPaymentDeleted}
    />
  </CardContent>
</Card>
```

#### Missing Payments Alert
The Payment History card displays a prominent alert for missing payments:

```tsx
{missingPayments.length > 0 && (
  <div className="mb-6 bg-red-50 border border-red-100 rounded-md p-4">
    <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
      <AlertCircle className="h-4 w-4 mr-2" />
      Missing Payments
    </h3>
    <div className="grid gap-4">
      {missingPayments.map((payment, index) => (
        <div key={index} className="bg-white p-3 border border-red-100 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-sm">{payment.month}</div>
              <div className="text-sm">QAR {payment.amount.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-amber-600 text-xs">{payment.daysOverdue} days overdue</div>
              <div className="text-red-600 text-xs">+ QAR {payment.lateFee.toLocaleString()} fine</div>
              <div className="font-bold text-red-700 mt-1 text-sm">Total: QAR {payment.totalDue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

#### Payment Table
The payment history is displayed in a table with the following columns:
- Date (formatted with day, month, year)
- Amount (with QAR currency formatting)
- Type (Income, Fee, etc.)
- Method (Cash, Credit Card, Bank Transfer, etc.)
- Status (Paid, Pending)
- Notes
- Actions (Edit, Delete)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Method</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Notes</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {payments.map((payment) => (
      <TableRow key={payment.id}>
        <TableCell className="text-sm">{formatDate(payment.payment_date)}</TableCell>
        <TableCell className="font-medium text-sm">QAR {payment.amount.toLocaleString()}</TableCell>
        <TableCell className="text-sm">
          <span className="capitalize">{payment.type === 'rent' ? 'Income' : payment.type}</span>
        </TableCell>
        <TableCell className="text-sm">{renderPaymentMethodBadge(payment.payment_method)}</TableCell>
        <TableCell className="text-sm">{renderStatusBadge(payment.status)}</TableCell>
        <TableCell className="max-w-[200px] truncate text-sm">{payment.notes || 'Monthly rent payment'}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => confirmDeletePayment(payment.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Empty State
When no payments exist, a clear empty state is displayed:

```tsx
<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
  <AlertCircle className="mb-2 h-10 w-10" />
  <h3 className="text-lg font-medium">No payments found</h3>
  <p className="mt-1 text-sm">No payment records exist for this agreement.</p>
</div>
```

#### Loading State
While payments are being fetched, a skeleton loading state is shown:

```tsx
<div className="space-y-3">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-24 w-full" />
  <Skeleton className="h-24 w-full" />
</div>
```

#### Payment Status Badges
Payment statuses are represented with color-coded badges:

```tsx
const renderStatusBadge = (status: string) => {
  switch(status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
```

#### Payment Method Badges
Payment methods are displayed with unique styling:

```tsx
const renderPaymentMethodBadge = (method: string) => {
  switch(method.toLowerCase()) {
    case 'cash':
      return <Badge className="bg-green-50 text-green-700 border-green-100">Cash</Badge>;
    case 'credit_card':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-100">Credit Card</Badge>;
    case 'bank_transfer':
      return <Badge className="bg-purple-50 text-purple-700 border-purple-100">Bank Transfer</Badge>;
    default:
      return <Badge className="bg-gray-50 text-gray-700 border-gray-100">{method}</Badge>;
  }
};
```

#### Delete Payment Confirmation
A confirmation dialog is shown before deleting payments:

```tsx
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this payment record. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDeletePayment}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Payment Data Fetching
The component uses a custom hook `usePayments` to fetch payment data:

```tsx
const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, null);

useEffect(() => {
  if (agreementId) {
    fetchPayments();
  }
}, [agreementId, fetchPayments]);
```

#### Missing Payments Logic
The component calculates missing payments based on expected payment dates:

```tsx
useEffect(() => {
  setMissingPayments([
    {
      month: "March 2025",
      amount: 1200,
      daysOverdue: 21,
      lateFee: 2520,
      totalDue: 3720
    }
  ]);
}, []);
```

#### Payment Deletion Handler
The component handles payment deletion with proper error handling:

```tsx
const handleDeletePayment = async () => {
  if (!paymentToDelete) return;

  try {
    const { error } = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentToDelete);

    if (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
      return;
    }

    toast.success("Payment deleted successfully");
    setIsDeleteDialogOpen(false);
    onPaymentDeleted();
  } catch (error) {
    console.error("Error in payment deletion:", error);
    toast.error("An unexpected error occurred");
  }
};
```

### 6. Payment Management
- **Payment History** - Chronological list of all payments made against the agreement
- **Payment Recording** - Interface to add new payment transactions
- **Payment Editing** - Ability to modify existing payment records
- **Payment Deletion** - Option to remove incorrect payment entries
- **Financial Summary** - Shows total paid, total due, and remaining balance
- **Late Payment Handling** - System for detecting and applying late payment fees
- **Payment Method Selection** - Options for recording different payment methods (cash, credit card, bank transfer, etc.)
- **Payment References** - Fields for recording transaction IDs or reference numbers

### 7. Record New Payment Dialog
The Record New Payment dialog is a modal interface for entering payment details. It is implemented in `PaymentEntryDialog.tsx` and includes the following features:

#### Dialog Structure
```tsx
<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
  <DialogContent className="sm:max-w-[450px]">
    <DialogHeader>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogDescription>Enter payment details below</DialogDescription>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form fields */}
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

#### Form Fields
1. **Amount Field**
   - Input for payment amount (QAR)
   - Default value is the monthly rent amount
   - Validation to ensure positive value

2. **Payment Date Field**
   - Date picker to select when payment was made
   - Uses Calendar popover for date selection
   - Includes validation to ensure date is provided

3. **Payment Method Field**
   - Dropdown select for payment method
   - Options include: Cash, Credit Card, Bank Transfer, Cheque
   - Required field with validation

4. **Reference Number Field**
   - Optional input for transaction ID, cheque number, etc.
   - Help text explains purpose

5. **Notes Field**
   - Optional textarea for additional payment information
   - Allows recording of special circumstances

#### Footer Actions
- **Cancel Button** - Closes dialog without saving
- **Record Payment Button** - Submits form and records payment

#### Form Validation
- Uses react-hook-form with zod validation
- Validates all required fields
- Displays appropriate error messages

#### Late Fee Detection
- Automatically detects late payments (after 1st of month)
- Calculates applicable late fee
- Option to include late fee in payment record

#### Implementation
```tsx
const formSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.date(),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  referenceNumber: z.string().optional()
});

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount,
  title = "Record Payment",
  description = "Enter payment details below"
}: PaymentEntryDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultAmount,
      paymentDate: new Date(),
      notes: '',
      paymentMethod: 'cash',
      referenceNumber: ''
    }
  });

  // Update form when defaultAmount changes
  React.useEffect(() => {
    form.setValue('amount', defaultAmount);
  }, [defaultAmount, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.amount, values.paymentDate, values.notes);
  };

  // Form JSX rendering
}
```

#### Styling
- Clean, modern interface with consistent spacing
- Form controls use Shadcn UI components
- Responsive layout that works on mobile and desktop
- Validation messages clearly displayed below fields
- Blue accent color for the submit button
- Dialog smoothly animates in and out

### 8. Traffic Fines Tracking
- **Violation List** - Shows all traffic violations associated with the agreement
- **Fine Details** - Information about each violation including date, location, and amount
- **Payment Status** - Indicates whether fines have been paid, disputed, or are pending
- **Violation Charge** - Description of the traffic rule that was violated
- **Location Information** - Where the violation occurred
- **Fine Amount** - The monetary penalty for the violation
- **Automatic Association** - System automatically links fines to agreements based on date and vehicle

### 9. Document Management
- **PDF Generation** - Functionality to create and download a PDF copy of the agreement
- **Print Option** - Ability to print the agreement directly
- **Template-Based Generation** - PDFs are generated using predefined templates with agreement data
- **Digital Signature Support** - PDF documents can include digital signatures when available

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
   - **Implementation**: Uses the `generatePdfDocument` utility function to create the PDF

4. **Record Payment Button**
   - **Label**: "Record Payment"
   - **Icon**: DollarSign icon
   - **Action**: Opens the payment entry dialog
   - **Behavior**: Displays a modal with a form for recording a new payment
   - **Form Fields**: Amount, payment date, payment method, reference number, and notes
   - **Styling**: Blue accent color to draw attention as a primary action
   - **Position**: Right-aligned in the button group

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
<PaymentEntryDialog 
  open={isPaymentDialogOpen} 
  onOpenChange={setIsPaymentDialogOpen}
  onSubmit={handlePaymentSubmit}
  defaultAmount={rentAmount || 0}
  title="Record Rent Payment"
  description="Record a new rental payment for this agreement."
/>
```

The payment dialog component handles form state and validation:

```typescript
export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount,
  title = "Record Payment",
  description = "Enter payment details below"
}: PaymentEntryDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultAmount,
      paymentDate: new Date(),
      notes: '',
      paymentMethod: 'cash',
      referenceNumber: ''
    }
  });

  // Update form when defaultAmount changes
  React.useEffect(() => {
    form.setValue('amount', defaultAmount);
  }, [defaultAmount, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.amount, values.paymentDate, values.notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Form fields */}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Late Payment Fee Handling
The system automatically calculates late payment fees based on configured rates:

```typescript
const calculateLateFee = async (date: Date) => {
  // Get the current month's first day
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // If payment date is after the 1st, calculate late fee
  if (date.getDate() > 1) {
    // Calculate days late (payment date - 1st of month)
    const daysLate = date.getDate() - 1;
    
    // Calculate late fee amount (daily_late_fee * days late, with possible maximum cap)
    const dailyLateFee = agreement?.daily_late_fee || 120; // Default 120 if not specified
    const calculatedFee = Math.min(daysLate * dailyLateFee, 3000); // Cap at 3000
    
    setLateFeeDetails({
      amount: calculatedFee,
      daysLate: daysLate
    });
  } else {
    setLateFeeDetails(null);
  }
};
```

### PDF Generation
The agreement can be exported as a PDF document using a specialized utility:

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
    differenceInMonths(new Date(leaseEndDate), new Date(leaseStartDate))
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
      
      if (directFines && directFines.length > 0) {
        allFines = directFines.map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number,
          licensePlate: fine.license_plate,
          violationDate: fine.violation_date,
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.fine_location,
          lease_id: fine.lease_id,
          vehicle_id: fine.vehicle_id
        }));
      }
      
      if (dateRangeFines && dateRangeFines.length > 0) {
        dateRangeFines.forEach(fine => {
          if (!allFines.some(f => f.id === fine.id)) {
            allFines.push({
              id: fine.id,
              violationNumber: fine.violation_number,
              licensePlate: fine.license_plate,
              violationDate: fine.violation_date,
              fineAmount: fine.fine_amount,
              violationCharge: fine.violation_charge,
              paymentStatus: fine.payment_status,
              location: fine.fine_location,
              lease_id: fine.lease_id,
              vehicle_id: fine.vehicle_id
            });
          }
        });
      }
      
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

### Security Deposit Management
The system handles security deposits with dedicated functionality:

```typescript
// Recording a security deposit
const handleRecordDeposit = async (depositData) => {
  try {
    const { data, error } = await supabase.from('security_deposits').insert({
      lease_id: agreement.id,
      amount: depositData.amount,
      status: 'pending',
      notes: depositData.notes
    });
    
    if (error) throw error;
    
    toast.success('Security deposit recorded successfully');
    refreshDepositData();
  } catch (error) {
    console.error('Error recording security deposit:', error);
    toast.error('Failed to record security deposit');
  }
};

// Processing a deposit refund
const handleRefundDeposit = async (depositId, refundAmount, notes) => {
  try {
    const { error } = await supabase
      .from('security_deposits')
      .update({
        refund_amount: refundAmount,
        refund_date: new Date().toISOString(),
        status: refundAmount === depositAmount ? 'refunded' : 'partially_refunded',
        notes: notes
      })
      .eq('id', depositId);
    
    if (error) throw error;
    
    toast.success('Deposit refund processed successfully');
    refreshDepositData();
  } catch (error) {
    console.error('Error processing deposit refund:', error);
    toast.error('Failed to process deposit refund');
  }
};
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

### Security Deposit Object
Represents a security deposit and its status:

```typescript
interface SecurityDeposit {
  id: string;
  lease_id: string;
  amount: number;
  status: 'pending' | 'held' | 'partially_refunded' | 'refunded';
  refund_amount?: number;
  refund_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
4. If the payment date is after the 1st of the month, system offers to include late payment fee
5. User submits the form
6. System records the payment (and late fee if applicable) and updates the payment history
7. Success notification is displayed

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

### Managing Traffic Fines
1. User reviews traffic fines in the dedicated section
2. User can see violation details, dates, and amounts
3. User can update payment status of fines
4. Changes are saved to the database

### Processing Security Deposits
1. User can view security deposit information
2. User can record refunds (partial or full)
3. System tracks deposit status (held, partially refunded, fully refunded)
4. Financial summaries are updated accordingly

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
- Input validation prevents invalid data entry

## Responsive Design
The Agreement Details page is fully responsive:
- On large screens, information is displayed in a multi-column layout
- On medium screens, some sections collapse to a single column
- On small/mobile screens, all sections stack vertically
- Modal dialogs are scrollable on smaller screens with a maximum height
- Buttons and interactive elements are appropriately sized for touch interfaces

## Performance Considerations
- Data is fetched only when needed using state tracking
- Payment history uses optimized queries with pagination when appropriate
- PDF generation happens asynchronously without blocking the UI
- Large data sets are processed in batches to maintain responsiveness
- Caching is implemented for frequently accessed data

## Security
- Agreement access is restricted to authenticated users
- The page checks for authorization to view the specific agreement
- Sensitive data is appropriately protected and masked when necessary
- Operations like deletion require explicit confirmation
- All database operations use prepared statements to prevent SQL injection

## Accessibility Features
- All interactive elements have appropriate ARIA labels
- Color contrast meets WCAG standards
- Keyboard navigation is supported throughout the interface
- Form elements have associated labels and error messages
- Modal dialogs trap focus appropriately

## Integration Points
- **Customers Module** - Links to customer profiles and data
- **Vehicles Module** - Connects to vehicle information and availability
- **Payments System** - Integrates with payment processing and financial records
- **Traffic Fines System** - Fetches and manages violation data
- **Document Generation** - Creates PDFs and other agreement documents
- **Notification System** - Sends alerts for payment reminders and updates
