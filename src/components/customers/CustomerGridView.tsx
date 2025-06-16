
import React from 'react';
import { CustomerCard } from './CustomerCard';
import { Customer } from '@/lib/validation-schemas/customer';
import { GridLayout } from '@/components/ui/grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface CustomerGridViewProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomerSelect?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export const CustomerGridView: React.FC<CustomerGridViewProps> = ({
  customers,
  isLoading,
  onCustomerSelect,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <GridLayout columns={{ base: 1, md: 2, xl: 3 }} gap="lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </GridLayout>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          لا توجد عملاء
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          لم يتم العثور على أي عملاء.
        </p>
      </div>
    );
  }

  return (
    <GridLayout columns={{ base: 1, md: 2, xl: 3 }} gap="lg" className="animate-fade-in">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onSelect={onCustomerSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </GridLayout>
  );
};
