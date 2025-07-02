
import React from 'react';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { CustomerDetailsSidebar } from '@/components/customers/CustomerDetailsSidebar';
import type { CustomerInfo } from '@/types/customer';

interface CustomerPageModalsProps {
  isImportModalOpen: boolean;
  onImportModalChange: (open: boolean) => void;
  onImportComplete: () => void;
  selectedCustomer: CustomerInfo | null;
  isSidebarOpen: boolean;
  onSidebarChange: (open: boolean) => void;
}

export const CustomerPageModals: React.FC<CustomerPageModalsProps> = ({
  isImportModalOpen,
  onImportModalChange,
  onImportComplete,
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
      
      <CustomerDetailsSidebar
        customer={selectedCustomer}
        open={isSidebarOpen}
        onOpenChange={onSidebarChange}
      />
    </>
  );
};
