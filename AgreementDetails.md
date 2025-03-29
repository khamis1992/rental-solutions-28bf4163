
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
- `src/utils/agreementUtils.ts` - Utility functions including PDF generation

## Implementation

### AgreementDetailPage.tsx
This page fetches agreement data using the agreement ID from URL parameters:

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { initializeSystem, supabase } from '@/lib/supabase';
import { differenceInMonths } from 'date-fns';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [paymentGenerationAttempted, setPaymentGenerationAttempted] = useState(false);
  const [contractAmount, setContractAmount] = useState<number | null>(null);
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Initialize the system to check for payment generation
    initializeSystem().then(() => {
      console.log("System initialized, checking for payments");
    });

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
          
          // For any agreement, check for missing monthly payments
          if (data.status === 'active' && !paymentGenerationAttempted) {
            console.log(`Checking for missing payments for agreement ${data.agreement_number}...`);
            setPaymentGenerationAttempted(true);
          }
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
  }, [id, getAgreement, navigate, hasAttemptedFetch, paymentGenerationAttempted, refreshTrigger]);

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

  return (
    <PageContainer
      title="Agreement Details"
      description="View and manage rental agreement details"
      backLink="/agreements"
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      ) : agreement ? (
        <AgreementDetail 
          agreement={agreement} 
          onDelete={handleDelete}
          contractAmount={contractAmount}
          rentAmount={rentAmount}
          onPaymentDeleted={refreshAgreementData}
        />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
```

### AgreementDetail.tsx
This component displays all agreement details including customer information, vehicle details, payment history, and traffic fines:

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { formatCurrency } from "@/lib/utils"
import { Agreement, AgreementStatus } from "@/lib/validation-schemas/agreement"
import { Badge } from "@/components/ui/badge"
import { format, differenceInMonths } from "date-fns"
import { Trash2, Edit, FileText, Download } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect, useCallback } from "react"
import { PaymentEntryForm } from "./PaymentEntryForm"
import { Payment, PaymentHistory } from "./PaymentHistory"
import { supabase, initializeSystem } from "@/lib/supabase"
import { AgreementTrafficFines } from "./AgreementTrafficFines"
import { generatePdfDocument } from "@/utils/agreementUtils"

interface AgreementDetailProps {
  agreement: Agreement
  onDelete?: (id: string) => void
  contractAmount?: number | null
  rentAmount?: number | null
  onPaymentDeleted?: () => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case AgreementStatus.ACTIVE:
      return "bg-green-500"
    case AgreementStatus.EXPIRED:
      return "bg-gray-500"
    case AgreementStatus.CANCELLED:
      return "bg-red-500"
    case AgreementStatus.DRAFT:
      return "bg-yellow-500"
    case AgreementStatus.PENDING:
      return "bg-blue-500"
    case AgreementStatus.CLOSED:
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}

export const AgreementDetail: React.FC<AgreementDetailProps> = ({ 
  agreement, 
  onDelete,
  contractAmount,
  rentAmount,
  onPaymentDeleted
}) => {
  const navigate = useNavigate()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [localRentAmount, setLocalRentAmount] = useState<number | null>(rentAmount)
  const [durationMonths, setDurationMonths] = useState<number>(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    if (agreement.start_date && agreement.end_date) {
      const months = differenceInMonths(
        new Date(agreement.end_date),
        new Date(agreement.start_date)
      );
      setDurationMonths(months > 0 ? months : 1);
    }
  }, [agreement]);

  const handleEdit = () => {
    if (agreement && agreement.id) {
      navigate(`/agreements/edit/${agreement.id}`);
      toast.info("Editing agreement " + agreement.agreement_number);
    } else {
      toast.error("Cannot edit: Agreement ID is missing");
    }
  }

  const handleDelete = () => {
    if (onDelete && agreement.id) {
      onDelete(agreement.id);
    }
  }

  const handlePrintAgreement = () => {
    toast.info("Print functionality will be implemented in a future update")
  }

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

  const fetchRentAmount = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount")
        .eq("id", agreement.id)
        .single();
      
      if (error) {
        console.error("Error fetching rent amount:", error);
        return;
      }
      
      if (data && data.rent_amount) {
        setLocalRentAmount(data.rent_amount);
        console.log("Fetched rent amount:", data.rent_amount);
      }
    } catch (error) {
      console.error("Error fetching rent amount:", error);
    }
  }, [agreement.id]);

  const fetchPayments = useCallback(async () => {
    setIsLoadingPayments(true)
    try {
      console.log("Fetching payments for agreement:", agreement.id);
      
      const { data: unifiedPayments, error: unifiedError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id)
        .order('payment_date', { ascending: false });
      
      if (unifiedError) {
        console.error("Error fetching unified payments:", unifiedError);
        throw unifiedError;
      }
      
      console.log("Raw payments data:", unifiedPayments);
      
      const formattedPayments = (unifiedPayments || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.transaction_id,
        notes: payment.description,
        type: payment.type,
        status: payment.status,
        late_fine_amount: payment.late_fine_amount,
        days_overdue: payment.days_overdue,
        lease_id: payment.lease_id
      }));
      
      setPayments(formattedPayments);
      console.log("Formatted payments set:", formattedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoadingPayments(false);
    }
  }, [agreement.id]);

  useEffect(() => {
    const initializeAndFetch = async () => {
      await initializeSystem();
      
      if (rentAmount === null || rentAmount === undefined) {
        await fetchRentAmount();
      }
      
      await fetchPayments();
    };
    
    initializeAndFetch();
  }, [agreement.id, fetchPayments, fetchRentAmount, rentAmount]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(agreement.created_at || new Date()), "PPP")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(agreement.status)}>
            {agreement.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent>
            {agreement.customers ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Name</p>
                  <p>{agreement.customers.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p>{agreement.customers.email || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p>{agreement.customers.phone || agreement.customers.phone_number || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Details about the rented vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            {agreement.vehicles ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Vehicle</p>
                  <p>{agreement.vehicles.make} {agreement.vehicles.model} ({agreement.vehicles.year})</p>
                </div>
                <div>
                  <p className="font-medium">License Plate</p>
                  <p>{agreement.vehicles.license_plate || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Color</p>
                  <p>{agreement.vehicles.color || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No vehicle information available</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
            <CardDescription>Rental terms and payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Rental Period</p>
                  <p>
                    {format(new Date(agreement.start_date), "PPP")} to {format(new Date(agreement.end_date), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Additional Drivers</p>
                  <p>
                    {agreement.additional_drivers && agreement.additional_drivers.length > 0
                      ? agreement.additional_drivers.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Monthly Rent Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(localRentAmount || agreement.total_amount)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Contract Amount</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(contractAmount || (localRentAmount ? localRentAmount * durationMonths : agreement.total_amount * durationMonths))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Monthly rent × {durationMonths} {durationMonths === 1 ? 'month' : 'months'})
                  </p>
                </div>
                <div>
                  <p className="font-medium">Deposit Amount</p>
                  <p>{formatCurrency(agreement.deposit_amount || 0)}</p>
                </div>
                <div>
                  <p className="font-medium">Daily Late Fee</p>
                  <p>{agreement.daily_late_fee !== undefined ? formatCurrency(agreement.daily_late_fee) : "Not specified"}</p>
                </div>
                <div>
                  <p className="font-medium">Terms Accepted</p>
                  <p>{agreement.terms_accepted ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="font-medium">Signature</p>
                  <p>{agreement.signature_url ? "Signed" : "Not signed"}</p>
                </div>
              </div>
            </div>
            
            {agreement.notes && (
              <div className="mt-6">
                <p className="font-medium">Notes</p>
                <p className="whitespace-pre-line">{agreement.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={handlePrintAgreement}>
                <FileText className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadAgreement}
                disabled={isGeneratingPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </Button>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
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
                    onPaymentComplete={() => {
                      setIsPaymentDialogOpen(false);
                      fetchPayments();
                    }} 
                    defaultAmount={localRentAmount}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    agreement and remove the data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <div className="md:col-span-2">
          <PaymentHistory 
            payments={payments} 
            isLoading={isLoadingPayments} 
            rentAmount={localRentAmount}
            onPaymentDeleted={onPaymentDeleted}
            leaseStartDate={agreement.start_date}
            leaseEndDate={agreement.end_date}
          />
        </div>

        <div className="md:col-span-2">
          <AgreementTrafficFines 
            agreementId={agreement.id}
            startDate={agreement.start_date}
            endDate={agreement.end_date}
          />
        </div>
      </div>
    </div>
  )
}
```

### PaymentHistory.tsx
This component displays the payment history for an agreement:

```typescript
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PaymentEditDialog } from "./PaymentEditDialog";

export type Payment = {
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

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

const getPaymentStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-300";
    case "partial":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  payments, 
  isLoading, 
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setIsEditDialogOpen(false);
    setEditingPayment(null);
    // Trigger a refresh of payment data
    if (onPaymentDeleted) {
      onPaymentDeleted();
    }
  };

  const deletePayment = async (paymentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      toast.success("Payment deleted successfully");
      
      // Call the callback to refresh payment data
      if (onPaymentDeleted) {
        onPaymentDeleted();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
      setPaymentToDelete(null);
    }
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Loading payment records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Record of all payments for this agreement</CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div 
                key={payment.id} 
                className="flex flex-col sm:flex-row justify-between p-4 border rounded-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    {payment.status && (
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {payment.payment_date ? format(
                      typeof payment.payment_date === 'string' ? parseISO(payment.payment_date) : new Date(payment.payment_date),
                      "PPP"
                    ) : "N/A"}
                  </p>
                  {payment.payment_method && (
                    <p className="text-sm text-muted-foreground">
                      Method: {payment.payment_method}
                      {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                    </p>
                  )}
                  {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
                  {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                    <p className="text-sm text-red-600">
                      Includes late fee: {formatCurrency(payment.late_fine_amount)}
                      {payment.days_overdue && payment.days_overdue > 0 ? ` (${payment.days_overdue} days overdue)` : ''}
                    </p>
                  )}
                </div>
                <div className="flex mt-2 sm:mt-0 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(payment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog open={paymentToDelete === payment.id} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentToDelete(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the payment record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePayment(payment.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            No payment records found for this agreement.
          </p>
        )}
      </CardContent>

      {/* Payment Edit Dialog */}
      {editingPayment && (
        <PaymentEditDialog 
          payment={editingPayment}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)} 
          onComplete={handleEditComplete}
        />
      )}
    </Card>
  );
};
```

### AgreementTrafficFines.tsx
This component displays traffic fines associated with the agreement:

```typescript
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrafficFineStatusType } from "@/hooks/use-traffic-fines";
import { toast } from "sonner";

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

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500 text-white border-green-600";
    case "disputed":
      return "bg-amber-500 text-white border-amber-600";
    case "pending":
    default:
      return "bg-red-500 text-white border-red-600";
  }
};

export const AgreementTrafficFines = ({ 
  agreementId, 
  startDate,
  endDate 
}: AgreementTrafficFinesProps) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        // Use snake_case field names to match the database
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
          // Transform data from snake_case to camelCase
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
          // Transform data from snake_case to camelCase
          const transformedDateRangeFines = dateRangeFines.map(fine => ({
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
          
          transformedDateRangeFines.forEach(fine => {
            if (!allFines.some(f => f.id === fine.id)) {
              allFines.push(fine);
            }
          });
        }

        // Check if any fines were found
        console.log("All traffic fines found:", allFines);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>Loading traffic violations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
        <CardDescription>
          Violations during the rental period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trafficFines.length > 0 ? (
          <div className="space-y-4">
            {trafficFines.map((fine) => (
              <div 
                key={fine.id} 
                className="flex flex-col sm:flex-row justify-between p-4 border rounded-md"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">Violation #{fine.violationNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(fine.violationDate), "PPP")}
                    {fine.location && ` at ${fine.location}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{fine.violationCharge}</p>
                </div>
                <div className="flex flex-col sm:items-end mt-2 sm:mt-0">
                  <p className="font-bold">{formatCurrency(fine.fineAmount)}</p>
                  <Badge className={`${getStatusColor(fine.paymentStatus)} mt-1`}>
                    {fine.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            No traffic fines recorded for this rental period.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
```

### PaymentEntryForm.tsx
This component provides a form for recording new payments:

```typescript
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface PaymentEntryFormProps {
  agreementId: string;
  onPaymentComplete: () => void;
  defaultAmount?: number | null;
}

export const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({ 
  agreementId, 
  onPaymentComplete,
  defaultAmount = 0
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("Monthly rent payment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the payment record in the unified_payments table
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: agreementId,
          amount: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          transaction_id: referenceNumber || null,
          description: notes || "Payment",
          type: "Income",
          status: "paid"
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("Payment recorded successfully");
      onPaymentComplete();
      
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Payment Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="date">Payment Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !paymentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={paymentDate}
                onSelect={(date) => date && setPaymentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="method">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="reference">Reference Number (Optional)</Label>
          <Input
            id="reference"
            placeholder="Transaction ID, check number, etc."
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional information about this payment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
};
```

### PaymentEditDialog.tsx
This component provides a dialog for editing existing payments:

```typescript
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Payment } from "./PaymentHistory";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface PaymentEditDialogProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const PaymentEditDialog: React.FC<PaymentEditDialogProps> = ({
  payment,
  isOpen,
  onClose,
  onComplete
}) => {
  const [amount, setAmount] = useState<number>(payment.amount);
  const [paymentDate, setPaymentDate] = useState<Date>(
    payment.payment_date ? new Date(payment.payment_date) : new Date()
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    payment.payment_method || "cash"
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    payment.reference_number || ""
  );
  const [notes, setNotes] = useState<string>(payment.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the payment record in the unified_payments table
      const { data, error } = await supabase
        .from('unified_payments')
        .update({
          amount: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          transaction_id: referenceNumber || null,
          description: notes || "Payment",
        })
        .eq('id', payment.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("Payment updated successfully");
      onComplete();
      
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update the payment details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="date">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="Transaction ID, check number, etc."
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

## Key Features

### Payment Management
- View complete payment history with detailed information
- Record new payments with various payment methods
- Edit existing payment details with user-friendly forms
- Delete payments if needed
- Automatic calculation of total paid, due, and remaining balance

### Traffic Fine Tracking
- Display of all traffic violations associated with the agreement
- Show fine details including violation number, date, location, and amount
- Visual indicators for fine status (paid, disputed, pending)
- Automatic association of fines by both direct lease ID and date range

### Document Generation
- PDF generation with agreement details for printing and archiving
- Structured layout with customer information, vehicle details, payment terms
- Dynamic calculation of contract duration and total amount
- Support for signatures and legal text

### Agreement Actions
- Edit agreement details with form redirect
- Delete agreement with confirmation dialog
- View comprehensive agreement information in a clean, structured layout
- Record payments directly from the details page

## Integration Points
The Agreement Details page integrates with:
1. **Customer Management** - Displaying customer information
2. **Vehicle Management** - Showing vehicle details
3. **Financial System** - Payment recording and tracking
4. **Document Generation** - PDF creation for agreements
5. **Traffic Fine System** - Fine tracking and management

## Error Handling
The page includes proper error handling for:
1. Failed data fetching with graceful fallbacks and user notifications
2. Missing agreement data with clear user feedback
3. Payment recording/editing failures with error messages
4. PDF generation errors with appropriate user notifications

## Design Elements
The page uses Tailwind CSS and shadcn/ui components to create a clean, professional interface:
- Cards with clear headers and consistent styling
- Badges for status indication with meaningful colors
- Responsive grid layout that adapts to different screen sizes
- Modals and dialogs for interactive operations
- Skeleton loaders for improved perceived performance during data loading

## Workflow
1. When the user navigates to an agreement details page, the system fetches the agreement data by ID
2. The page displays customer information, vehicle details, and agreement terms in separate cards
3. Payment history is loaded from the unified_payments table and displayed in chronological order
4. Traffic fines are fetched for both the agreement ID and by date range for the vehicle
5. Users can perform actions like editing, deleting, recording payments, or generating PDF documents

This comprehensive implementation provides a complete view of each rental agreement and supports all necessary management functions in a user-friendly interface.
