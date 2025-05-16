
import React from 'react';
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ value, onChange }) => {
  const customerService = useCustomerService();
  
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await customerService.getCustomers();
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a customer" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Loading...</SelectItem>
        ) : customers && customers.length > 0 ? (
          customers.map((customer: any) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="none" disabled>No customers available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default CustomerSelector;
