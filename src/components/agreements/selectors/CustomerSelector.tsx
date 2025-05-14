
import React, { useState, useEffect } from 'react';
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ value, onChange }) => {
  const { customers, isLoading, error } = useCustomerService();
  const [selectedCustomer, setSelectedCustomer] = useState<string>(value || '');

  useEffect(() => {
    if (value) {
      setSelectedCustomer(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedCustomer(newValue);
    onChange(newValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Loading customers...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading customers</div>;
  }

  return (
    <Select value={selectedCustomer} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select customer" />
      </SelectTrigger>
      <SelectContent>
        {customers && customers.map(customer => (
          <SelectItem key={customer.id} value={customer.id || ''}>
            {customer.full_name || 'Unknown'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CustomerSelector;
