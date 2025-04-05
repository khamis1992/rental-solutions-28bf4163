
# Car Installment Contracts Documentation

This document provides comprehensive documentation for the Car Installment Contracts feature in the Fleet Management System. The feature allows managing installment contracts for vehicle purchases, tracking payments, and analyzing financial metrics related to vehicle financing.

## Table of Contents

- [Overview](#overview)
- [UI Components](#ui-components)
- [Data Structure](#data-structure)
- [Workflows](#workflows)
- [Code Implementation](#code-implementation)
- [User Experience](#user-experience)

## Overview

The Car Installment Contracts module is accessible from the Financials page and provides functionality to:

- Create and manage vehicle purchase contracts with installment payment plans
- Track payment schedules and record payments
- Visualize payment progress with progress bars
- Filter and search contracts
- Import payment schedules
- View detailed analytics on contract status

The module integrates with the overall financial management system and provides real-time financial data on portfolio values, collection rates, and upcoming payments.

## UI Components

### Main Components

1. **CarInstallmentContracts** - The main container component that orchestrates the contracts view
2. **ContractSummaryCards** - Displays key metrics about the contracts portfolio
3. **CarContractsList** - The main data table showing all contracts with search and filter functionality
4. **ContractDialog** - Form dialog for adding/editing contracts
5. **ContractDetailDialog** - Detailed view of a contract with payments schedule
6. **PaymentDialog** - Form for recording payments against installments
7. **ImportPaymentsDialog** - Interface for bulk importing payment schedules

### Visual Design Elements

The installment contracts page uses the following design elements:

- **Color Scheme**:
  - Primary purple: #9b87f5
  - Progress indicators: Green (#10b981), Amber (#f59e0b), Red (#ef4444)
  - Neutral backgrounds: Light gray (#f3f4f6)

- **Typography**:
  - Headings: 2xl (24px), Semi-bold
  - Table headers: 14px, Medium
  - Body text: 14px, Regular

- **Layout**:
  - Card-based summary metrics
  - Full-width responsive data table
  - Modal dialogs for forms and detailed views

## Data Structure

### Core Data Models

```typescript
// Car Installment Contract Model
interface CarInstallmentContract {
  id: string;
  car_type: string;
  model_year: string;
  number_of_cars: number;
  price_per_car: number;
  total_contract_value: number;
  total_installments: number;
  installment_value: number;
  amount_paid: number;
  amount_pending: number;
  remaining_installments: number;
  overdue_payments: number;
  category: string;
  created_at?: string;
  updated_at?: string;
}

// Car Installment Payment Model
interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  cheque_number?: string;
  drawee_bank?: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Contract Summary Model
interface ContractSummary {
  totalContracts: number;
  totalPortfolioValue: number;
  totalCollections: number;
  upcomingPayments: number;
}
```

## Workflows

### Creating a New Contract

1. User clicks "Add Contract" button
2. ContractDialog form opens
3. User enters contract details:
   - Car type/model
   - Model year
   - Number of cars
   - Price per car
   - Number of installments
4. System calculates:
   - Total contract value
   - Installment amount
5. User submits the form
6. New contract is created and displayed in the list

### Recording a Payment

1. User opens contract details by clicking on a contract
2. User navigates to the "Payment Schedule" tab
3. User clicks "Record Payment" on a pending payment
4. Payment dialog opens with the payment amount pre-filled
5. User confirms the payment
6. System updates:
   - Payment status
   - Contract's total paid amount
   - Contract's remaining balance
   - Progress indicators

### Importing Payments

1. User opens contract details
2. User clicks "Import" button
3. Import dialog opens
4. User uploads CSV file with payment schedule
5. System validates the data
6. User confirms import
7. Multiple payment records are created at once

## Code Implementation

### Main Component: CarInstallmentContracts

```tsx
import React, { useState } from 'react';
import { useCarInstallments } from '@/hooks/use-car-installments';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CarContractsList } from './CarContractsList';
import { ContractSummaryCards } from './ContractSummaryCards';
import { ContractDialog } from './ContractDialog';
import { ContractDetailDialog } from './ContractDetailDialog';
import { CarInstallmentContract } from '@/types/car-installment';

const CarInstallmentContracts = () => {
  const {
    contracts,
    isLoadingContracts,
    summary,
    isLoadingSummary,
    contractFilters,
    setContractFilters,
    createContract
  } = useCarInstallments();

  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<CarInstallmentContract | null>(null);

  const handleAddContract = () => {
    setIsContractDialogOpen(true);
  };

  const handleViewContract = (contract: CarInstallmentContract) => {
    setSelectedContract(contract);
    setIsDetailDialogOpen(true);
  };

  const handleContractSubmit = (data: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    createContract(data);
    setIsContractDialogOpen(false);
  };

  const handleCloseContractDialog = () => {
    setIsContractDialogOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setContractFilters({
      ...contractFilters,
      search: value
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setContractFilters({
      ...contractFilters,
      status: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">Car Installment Contracts</h2>
        <Button onClick={handleAddContract}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      <ContractSummaryCards 
        summary={summary} 
        isLoading={isLoadingSummary} 
      />

      <CarContractsList
        contracts={contracts || []}
        isLoading={isLoadingContracts}
        onContractClick={handleViewContract}
        filters={contractFilters}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
      />

      <ContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        onSubmit={handleContractSubmit}
        onClose={handleCloseContractDialog}
      />

      {selectedContract && (
        <ContractDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          contract={selectedContract}
        />
      )}
    </div>
  );
};

export default CarInstallmentContracts;
```

### Contracts List Component

```tsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarInstallmentContract, ContractFilters } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CarContractsListProps {
  contracts: CarInstallmentContract[];
  isLoading: boolean;
  onContractClick: (contract: CarInstallmentContract) => void;
  filters: ContractFilters;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const CarContractsList: React.FC<CarContractsListProps> = ({
  contracts,
  isLoading,
  onContractClick,
  filters,
  onSearchChange,
  onStatusFilterChange
}) => {
  // Calculate payment progress percentage
  const getProgressPercentage = (contract: CarInstallmentContract) => {
    if (contract.total_contract_value === 0) return 0;
    return Math.round((contract.amount_paid / contract.total_contract_value) * 100);
  };

  // Get color based on progress and overdue status
  const getProgressColor = (contract: CarInstallmentContract) => {
    if (contract.overdue_payments > 0) return 'bg-red-500';
    const progress = getProgressPercentage(contract);
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-emerald-500';
    if (progress >= 25) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by car type..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-md bg-muted p-8 text-center">
          <p className="text-muted-foreground">No contracts found</p>
          {filters.search && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search or filter criteria
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Cars</TableHead>
                <TableHead>Price/Car</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.car_type}</TableCell>
                  <TableCell>{contract.model_year}</TableCell>
                  <TableCell>{contract.number_of_cars}</TableCell>
                  <TableCell>{formatCurrency(contract.price_per_car)}</TableCell>
                  <TableCell>{formatCurrency(contract.total_contract_value)}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={getProgressPercentage(contract)}
                        className="h-2"
                        indicatorClassName={getProgressColor(contract)}
                      />
                      <span className="text-xs w-12">
                        {getProgressPercentage(contract)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(contract.amount_pending)}</TableCell>
                  <TableCell>
                    <span className={contract.overdue_payments > 0 ? 'text-red-500 font-semibold' : ''}>
                      {contract.total_installments - contract.remaining_installments} / {contract.total_installments}
                      {contract.overdue_payments > 0 && ` (${contract.overdue_payments} overdue)`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onContractClick(contract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
```

### Contract Detail Dialog

```tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, Plus, FileUp } from 'lucide-react';
import { CarInstallmentContract, CarInstallmentPayment, PaymentFilters } from '@/types/car-installment';
import { useCarInstallments } from '@/hooks/use-car-installments';
import { ContractDetailSummary } from './ContractDetailSummary';
import { ContractPaymentsTable } from './ContractPaymentsTable';
import { PaymentDialog } from './PaymentDialog';
import { ImportPaymentsDialog } from './ImportPaymentsDialog';
import { PaymentFiltersBar } from './PaymentFiltersBar';

interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: CarInstallmentContract;
}

export const ContractDetailDialog: React.FC<ContractDetailDialogProps> = ({
  open,
  onOpenChange,
  contract,
}) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState<CarInstallmentPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [recordMode, setRecordMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CarInstallmentPayment | null>(null);
  const { 
    fetchContractPayments, 
    paymentFilters, 
    setPaymentFilters,
    addPayment,
    recordPayment,
    importPayments
  } = useCarInstallments();

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const result = await fetchContractPayments(contract.id, paymentFilters);
      setPayments(result);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Load payments when the dialog opens or filters change
  useEffect(() => {
    if (open && contract?.id) {
      loadPayments();
    }
  }, [open, contract?.id, paymentFilters]);

  const handleAddPayment = () => {
    setRecordMode(false);
    setSelectedPayment(null);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = (payment: CarInstallmentPayment) => {
    setRecordMode(true);
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (data: any) => {
    if (recordMode && selectedPayment) {
      // Record a payment against an existing installment
      recordPayment({
        id: selectedPayment.id,
        amountPaid: data.amount
      });
    } else {
      // Add a new payment
      addPayment({
        contract_id: contract.id,
        ...data
      });
    }
    setIsPaymentDialogOpen(false);
    setTimeout(loadPayments, 500); // Reload after a short delay
  };

  const handleImportSubmit = (payments: any[]) => {
    importPayments({
      contractId: contract.id,
      payments
    });
    setIsImportDialogOpen(false);
    setTimeout(loadPayments, 500); // Reload after a short delay
  };

  const handleExportTemplate = () => {
    // Create CSV template for download
    const headers = ['cheque_number', 'drawee_bank', 'amount', 'payment_date', 'notes'];
    const csv = [
      headers.join(','),
      '12345,Bank Name,5000,2025-03-01,Sample payment'
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.car_type}_payments_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFilterChange = (newFilters: PaymentFilters) => {
    setPaymentFilters({
      ...paymentFilters,
      ...newFilters
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract.car_type} ({contract.model_year})
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payment Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <ContractDetailSummary contract={contract} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAddPayment}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <FileUp className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleExportTemplate}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Template
                </Button>
              </div>
              <PaymentFiltersBar 
                filters={paymentFilters}
                onFilterChange={handleFilterChange}
              />
            </div>

            {isLoadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ContractPaymentsTable 
                payments={payments}
                onRecordPayment={handleRecordPayment}
              />
            )}
          </TabsContent>
        </Tabs>

        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          payment={selectedPayment}
          recordMode={recordMode}
        />

        <ImportPaymentsDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onSubmit={handleImportSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
```

### Data Fetching Hook

The `useCarInstallments` hook manages data fetching and state for the installment contracts module:

```typescript
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/integrations/supabase/client';
import { 
  CarInstallmentContract, 
  CarInstallmentPayment,
  ContractSummary,
  ImportedPayment,
  ContractFilters,
  PaymentFilters,
  InstallmentStatus
} from '@/types/car-installment';
import { useToast } from './use-toast';

export function useCarInstallments() {
  const { toast } = useToast();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({
    search: '',
    status: 'all',
  });
  
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    status: 'all',
  });

  // Fetch summary metrics
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useApiQuery<ContractSummary>(
    ['carInstallmentSummary'],
    async () => {
      try {
        // Get all contracts for total calculation
        const { data: contracts } = await supabase
          .from('car_installment_contracts')
          .select('total_contract_value, amount_paid');
          
        // Calculate upcoming payments (due in 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { data: upcomingPayments } = await supabase
          .from('car_installment_payments')
          .select('amount')
          .lte('payment_date', thirtyDaysFromNow.toISOString())
          .gt('payment_date', new Date().toISOString())
          .eq('status', 'pending');
        
        if (!contracts) {
          throw new Error('Failed to fetch contract data');
        }
        
        const totalPortfolioValue = contracts.reduce((sum, contract) => 
          sum + (contract.total_contract_value || 0), 0);
          
        const totalCollections = contracts.reduce((sum, contract) => 
          sum + (contract.amount_paid || 0), 0);
          
        const upcomingPaymentsTotal = upcomingPayments?.reduce((sum, payment) => 
          sum + (payment.amount || 0), 0) || 0;
        
        return {
          totalContracts: contracts.length,
          totalPortfolioValue,
          totalCollections,
          upcomingPayments: upcomingPaymentsTotal
        };
      } catch (error) {
        console.error('Error fetching car installment summary:', error);
        throw error;
      }
    }
  );

  // Fetch all contracts
  const {
    data: contracts,
    isLoading: isLoadingContracts,
    refetch: refetchContracts
  } = useApiQuery<CarInstallmentContract[]>(
    ['carInstallmentContracts', JSON.stringify(contractFilters)],
    async () => {
      try {
        let query = supabase
          .from('car_installment_contracts')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Apply filters
        if (contractFilters.search) {
          query = query.ilike('car_type', `%${contractFilters.search}%`);
        }
        
        if (contractFilters.status && contractFilters.status !== 'all') {
          if (contractFilters.status === 'active') {
            query = query.gt('remaining_installments', 0);
          } else if (contractFilters.status === 'completed') {
            query = query.eq('remaining_installments', 0);
          } else if (contractFilters.status === 'overdue') {
            query = query.gt('overdue_payments', 0);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching car installment contracts:', error);
        throw error;
      }
    }
  );

  // Additional hooks and methods for:
  // - fetchContract
  // - fetchContractPayments
  // - createContractMutation
  // - addPaymentMutation
  // - updatePaymentMutation
  // - recordPaymentMutation
  // - importPaymentsMutation

  return {
    // Data
    contracts,
    isLoadingContracts,
    summary,
    isLoadingSummary,
    
    // Filters
    contractFilters,
    setContractFilters,
    paymentFilters,
    setPaymentFilters,
    
    // Operations
    fetchContract,
    fetchContractPayments,
    createContract: createContractMutation.mutate,
    isCreatingContract: createContractMutation.isPending,
    addPayment: addPaymentMutation.mutate,
    isAddingPayment: addPaymentMutation.isPending,
    updatePayment: updatePaymentMutation.mutate,
    isUpdatingPayment: updatePaymentMutation.isPending,
    recordPayment: recordPaymentMutation.mutate,
    isRecordingPayment: recordPaymentMutation.isPending,
    importPayments: importPaymentsMutation.mutate,
    isImportingPayments: importPaymentsMutation.isPending,
    
    // Refetch helpers
    refetchContracts,
    refetchSummary
  };
}
```

## Database Schema

The module uses two primary tables in the Supabase database:

### car_installment_contracts

```sql
create table car_installment_contracts (
  id uuid primary key default uuid_generate_v4(),
  car_type text not null,
  model_year text,
  number_of_cars integer not null default 1,
  price_per_car numeric not null,
  total_contract_value numeric not null,
  total_installments integer not null,
  installment_value numeric not null,
  amount_paid numeric not null default 0,
  amount_pending numeric not null,
  remaining_installments integer not null,
  overdue_payments integer not null default 0,
  category text not null default 'car-finance',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### car_installment_payments

```sql
create table car_installment_payments (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references car_installment_contracts(id) on delete cascade,
  cheque_number text,
  drawee_bank text,
  amount numeric not null,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null,
  payment_date timestamp with time zone not null,
  status text not null check (status in ('pending', 'paid', 'overdue')),
  payment_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Integration with Financial Management

The Car Installment Contracts module integrates with the overall Financial Management system through:

1. The Financials page tabs navigation, accessible via the "Installment Contracts" tab
2. Financial reporting that includes installment contract data in overall financial metrics
3. System-wide financial data synchronization for consistent reporting

## User Experience

### Responsive Design

The interface is fully responsive:
- On desktop: Full data table with multiple columns
- On tablet: Simplified table with fewer visible columns
- On mobile: Card-based layout for optimal viewing

### Accessibility Features

- All interactive elements are keyboard accessible
- Color contrast meets WCAG AA standards
- Form fields have proper labels and error states
- Loading states are clearly indicated with spinners

### Performance Optimizations

- Query caching with React Query
- Pagination for large data sets
- Optimized data loading with selective query parameters
- Debounced search inputs

## Future Enhancements

Planned future enhancements for the module include:

1. Advanced analytics dashboard with projected cash flows
2. Integration with accounting software
3. Automatic payment reminders and notifications
4. Enhanced reporting capabilities
5. Document attachment functionality for contracts

## Development Guidelines

When extending or modifying this module:

1. Maintain type safety by using the defined TypeScript interfaces
2. Follow the established component structure
3. Use the same styling patterns and UI components
4. Test all changes against the existing workflows
5. Update documentation as needed

## Troubleshooting

Common issues and their solutions:

1. **Contract calculations incorrect**: Ensure the price_per_car and number_of_cars fields are properly populated
2. **Payment records not appearing**: Check that payment_date is formatted correctly as an ISO string
3. **Progress bars not updating**: Verify that recordPayment is updating both the payment and contract tables
4. **Filters not working**: Ensure contractFilters state is being properly passed to the query

## Conclusion

The Car Installment Contracts module provides a comprehensive solution for managing vehicle financing with installment payments. It integrates seamlessly with the overall financial management system and provides real-time insights into the financial status of the fleet acquisition process.
