
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
import { CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';
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
  const [paymentFilters, setPaymentFilters] = useState({
    status: '',
    dateRange: null
  });
  
  const { 
    recordPayment, 
    importPayments,
    fetchContractPayments
  } = useCarInstallments();

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      if (contract?.id) {
        const contractPayments = await fetchContractPayments(contract.id);
        setPayments(contractPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Load payments when the dialog opens
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
        paid_amount: data.amount,
        status: 'paid',
        payment_date: data.payment_date
      });
    } else {
      // Add a new payment
      recordPayment({
        contract_id: contract.id,
        ...data
      });
    }
    setIsPaymentDialogOpen(false);
    setTimeout(loadPayments, 500); // Reload after a short delay
  };

  const handleImportSubmit = (data: any[]) => {
    const paymentsToImport = data.map(item => ({
      ...item,
      contract_id: contract.id
    }));
    
    importPayments({
      contractId: contract.id,
      payments: paymentsToImport
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

  const handleFilterChange = (newFilters: any) => {
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
