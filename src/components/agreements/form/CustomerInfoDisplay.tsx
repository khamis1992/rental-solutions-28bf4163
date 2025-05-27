
import React from 'react';
import { CustomerInfo } from '@/types/customer';
import CustomerSection from '../CustomerSection';

interface CustomerInfoDisplayProps {
  customer: CustomerInfo;
}

export const CustomerInfoDisplay: React.FC<CustomerInfoDisplayProps> = ({ customer }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Customer Information</h3>
      <CustomerSection customer={customer} />
    </div>
  );
};
