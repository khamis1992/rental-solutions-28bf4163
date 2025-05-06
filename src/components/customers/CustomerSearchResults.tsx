
import React from 'react';
import { CustomerInfo } from '@/types/customer';

interface CustomerSearchResultsProps {
  results: CustomerInfo[];
  onSelect: (customer: CustomerInfo) => void;
  isLoading: boolean;
}

export const CustomerSearchResults: React.FC<CustomerSearchResultsProps> = ({ 
  results, 
  onSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-md p-4 bg-background shadow-md">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="border rounded-md p-4 text-center text-gray-500 bg-background shadow-md">
        No customers found
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-background shadow-md">
      {results.map((customer) => (
        <div 
          key={customer.id}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
          onClick={() => onSelect(customer)}
        >
          <div className="font-medium">{customer.full_name}</div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-2">
            <span>{customer.email}</span>
            {customer.phone_number && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>{customer.phone_number}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
