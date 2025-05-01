
import { CustomerInfo } from '@/types/vehicle-assignment.types';
import { UserIcon } from 'lucide-react';

interface CustomerDetailsSectionProps {
  customerInfo: CustomerInfo | null;
  isDetailsOpen: boolean;
}

export function CustomerDetailsSection({ customerInfo, isDetailsOpen }: CustomerDetailsSectionProps) {
  if (!customerInfo || !isDetailsOpen) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center">
        <UserIcon className="h-4 w-4 mr-1 text-gray-500" />
        Customer Details
      </h4>
      <div className="bg-gray-50 p-3 rounded-md">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Name:</dt>
            <dd className="font-medium">{customerInfo.full_name || 'N/A'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email:</dt>
            <dd>{customerInfo.email || 'N/A'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Phone:</dt>
            <dd>{customerInfo.phone_number || 'N/A'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">ID Number:</dt>
            <dd>{customerInfo.driver_license || 'N/A'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
