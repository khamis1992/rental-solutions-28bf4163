
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

## Implementation Guide

### AgreementDetailPage Implementation
This page fetches agreement data using the agreement ID from URL parameters and renders the AgreementDetail component:

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

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contractAmount, setContractAmount] = useState<number | null>(null);
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    initializeSystem();
    
    const fetchAgreement = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getAgreement(id);
        
        if (data) {
          // Get rent_amount from the leases table
          try {
            const { data: leaseData, error: leaseError } = await supabase
              .from("leases")
              .select("rent_amount, daily_late_fee")
              .eq("id", id)
              .single();
            
            if (!leaseError && leaseData) {
              if (leaseData.rent_amount) {
                data.total_amount = leaseData.rent_amount;
                setRentAmount(leaseData.rent_amount);
                
                // Calculate contract amount
                if (data.start_date && data.end_date) {
                  const durationMonths = Math.ceil(
                    (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 
                    (30 * 24 * 60 * 60 * 1000)
                  );
                  const calculatedContractAmount = leaseData.rent_amount * (durationMonths || 1);
                  setContractAmount(calculatedContractAmount);
                }
              }
              
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
      }
    };

    fetchAgreement();
  }, [id, getAgreement, navigate, refreshTrigger]);

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

### AgreementDetail Component
This component displays all agreement details including customer information, vehicle details, payment history, and traffic fines:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { Agreement, AgreementStatus } from "@/lib/validation-schemas/agreement";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMonths } from "date-fns";
import { Trash2, Edit, FileText, Download } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { PaymentEntryForm } from "./PaymentEntryForm";
import { Payment, PaymentHistory } from "./PaymentHistory";
import { supabase } from "@/lib/supabase";
import { AgreementTrafficFines } from "./AgreementTrafficFines";
import { generatePdfDocument } from "@/utils/agreementUtils";

interface AgreementDetailProps {
  agreement: Agreement;
  onDelete?: (id: string) => void;
  contractAmount?: number | null;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
}

// Component implementation includes:
// - Status badges
// - Customer and vehicle information cards
// - Agreement details card
// - Payment history section
// - Traffic fines section
// - Actions for edit, delete, print, download PDF, and record payment
```

### PaymentHistory Component
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

// Component includes:
// - Payment history list with status badges
// - Payment edit and delete functionality
// - Total paid, due, and remaining balance calculations
```

### PaymentEntryForm Component
This component provides a form for recording new payments:

```typescript
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PaymentEntryFormProps {
  agreementId: string;
  onPaymentComplete: () => void;
  defaultAmount?: number | null;
}

// Component includes:
// - Form fields for payment amount, date, method, reference, and notes
// - Form submission that creates payment records in the database
```

### Traffic Fines Functionality
The AgreementTrafficFines component shows traffic violations associated with the agreement:

```typescript
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

// Component includes:
// - List of traffic fines with details
// - Status indicators for pending, paid, or disputed fines
// - Actions to update fine status
```

### PDF Generation Utility
This utility function generates PDF documents for agreements:

```typescript
import { jsPDF } from 'jspdf';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    // Create a new PDF document with customer, vehicle, and agreement details
    const doc = new jsPDF();
    
    // Add sections for customer info, vehicle info, rental terms, payment details, etc.
    
    // Save the PDF file
    doc.save(`Agreement_${agreement.agreement_number}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};
```

## Data Flow
1. When the page loads, `AgreementDetailPage` fetches agreement data using the ID from URL params
2. The data is passed to `AgreementDetail` component which renders all sections
3. Payment history is fetched and displayed in the `PaymentHistory` component
4. Traffic fines are fetched and displayed in the `AgreementTrafficFines` component
5. Actions like edit, delete, and payment recording trigger appropriate API calls

## Key Features

### Payment Management
- View complete payment history
- Record new payments
- Edit existing payment details
- Delete payments if needed
- Calculate total paid amount and remaining balance

### Traffic Fine Tracking
- View traffic violations associated with the rental
- Update fine payment status
- Filter fines by date range or status

### Document Generation
- Generate PDF documents with agreement details
- Print agreement documentation

### Agreement Actions
- Edit agreement details
- Delete agreements
- Terminate or extend agreements
- Record additional payments

## Integration Points
The Agreement Details page integrates with:
1. **Customer Management** - Displaying customer information
2. **Vehicle Management** - Showing vehicle details
3. **Financial System** - Payment recording and tracking
4. **Document Generation** - PDF creation for agreements
5. **Legal Management** - Traffic fine tracking

## Implementation Requirements
To implement this feature, ensure:
1. Agreement schema includes all necessary fields
2. Database tables are set up for payments and traffic fines
3. API endpoints handle all CRUD operations
4. Components correctly display and format data
5. PDF generation utility is properly implemented

## Error Handling
The page includes proper error handling for:
1. Failed data fetching
2. Missing agreement data
3. Payment recording/editing failures
4. PDF generation errors
