
import React from 'react';
import { CustomerInfo } from '@/types/vehicle-assignment.types';

interface CustomerDetailsSectionProps {
  customerInfo: CustomerInfo | null;
  isDetailsOpen: boolean;
}

export const CustomerDetailsSection: React.FC<CustomerDetailsSectionProps> = ({
  customerInfo,
  isDetailsOpen
}) => {
  if (!isDetailsOpen || !customerInfo) return null;
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <h4 className="font-medium text-sm mb-2">Customer Information</h4>
      <div className="grid grid-cols-1 gap-1 text-sm">
        <div>
          <span className="font-medium">Name:</span> {customerInfo.full_name || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Email:</span> {customerInfo.email || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Phone:</span> {customerInfo.phone_number || 'N/A'}
        </div>
        <div>
          <span className="font-medium">License:</span> {customerInfo.driver_license || 'N/A'}
        </div>
      </div>
    </div>
  );
};
