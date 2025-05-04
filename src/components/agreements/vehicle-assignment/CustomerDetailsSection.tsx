
import { CustomerInfo } from '@/types/vehicle-assignment.types';

interface CustomerDetailsSectionProps {
  customerInfo: CustomerInfo | null;
  isDetailsOpen: boolean;
}

export function CustomerDetailsSection({ customerInfo, isDetailsOpen }: CustomerDetailsSectionProps) {
  if (!customerInfo || !isDetailsOpen) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Current Customer</h4>
      <div className="grid grid-cols-1 gap-1 text-sm">
        <div><span className="font-medium">Name:</span> {customerInfo.full_name}</div>
        {customerInfo.email && <div><span className="font-medium">Email:</span> {customerInfo.email}</div>}
        {customerInfo.phone_number && <div><span className="font-medium">Phone:</span> {customerInfo.phone_number}</div>}
      </div>
    </div>
  );
}

