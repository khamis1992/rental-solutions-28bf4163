
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, Plus, FileUp } from 'lucide-react';
import { CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';
import { ContractPaymentsTable } from '../ContractPaymentsTable';
import { PaymentFiltersBar } from '../PaymentFiltersBar';

interface PaymentsTabProps {
  contract: CarInstallmentContract;
  payments: CarInstallmentPayment[];
  isLoadingPayments: boolean;
  onAddPayment: () => void;
  onImportClick: () => void;
  onRecordPayment: (payment: CarInstallmentPayment) => void;
  onExportTemplate: () => void;
  paymentFilters: any;
  onFilterChange: (newFilters: any) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ 
  contract,
  payments,
  isLoadingPayments,
  onAddPayment,
  onImportClick,
  onRecordPayment,
  onExportTemplate,
  paymentFilters,
  onFilterChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={onAddPayment}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Payment
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onImportClick}
          >
            <FileUp className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onExportTemplate}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Template
          </Button>
        </div>
        <PaymentFiltersBar 
          filters={paymentFilters}
          onFilterChange={onFilterChange}
        />
      </div>

      {isLoadingPayments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ContractPaymentsTable 
          payments={payments}
          onRecordPayment={onRecordPayment}
        />
      )}
    </div>
  );
};
