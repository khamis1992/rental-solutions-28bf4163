
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useCustomerService } from '@/hooks/services/useCustomerService';

interface CustomerSelectorProps {
  onSelect: (customerId: string) => void;
  selectedCustomerId?: string;
}

export function CustomerSelector({ onSelect, selectedCustomerId }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, isLoading } = useCustomerService();

  const filteredCustomers = customers?.filter(customer => 
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <Select onValueChange={onSelect} value={selectedCustomerId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a customer" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="" disabled>Loading customers...</SelectItem>
          ) : (
            filteredCustomers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.full_name} - {customer.email}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
