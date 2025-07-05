
import React from 'react';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { CustomerDetailsSidebar } from '@/components/customers/CustomerDetailsSidebar';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';
import type { CustomerInfo } from '@/types/customer';

interface CustomerPageModalsProps {
  isImportModalOpen: boolean;
  onImportModalChange: (open: boolean) => void;
  onImportComplete: () => void;
  isAddCustomerModalOpen: boolean;
  onAddCustomerModalChange: (open: boolean) => void;
  onAddCustomerComplete: () => void;
  selectedCustomer: CustomerInfo | null;
  isSidebarOpen: boolean;
  onSidebarChange: (open: boolean) => void;
}

export const CustomerPageModals: React.FC<CustomerPageModalsProps> = ({
  isImportModalOpen,
  onImportModalChange,
  onImportComplete,
  isAddCustomerModalOpen,
  onAddCustomerModalChange,
  onAddCustomerComplete,
  selectedCustomer,
  isSidebarOpen,
  onSidebarChange,
}) => {
  return (
    <>
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={onImportModalChange}
        onImportComplete={onImportComplete}
      />
      
      <AddCustomerDialog
        open={isAddCustomerModalOpen}
        onClose={() => onAddCustomerModalChange(false)}
        onCustomerCreated={onAddCustomerComplete}
      />
      
      <CustomerDetailsSidebar
        customer={selectedCustomer}
        open={isSidebarOpen}
        onOpenChange={onSidebarChange}
      />
    </>
  );
};
