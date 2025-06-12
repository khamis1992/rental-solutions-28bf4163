
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useCustomerService } from '@/hooks/services/useCustomerService';

interface CustomerSelectorProps {
  onCustomerSelect: (customer: any) => void;
  selectedCustomerId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerSelector({ 
  onCustomerSelect, 
  selectedCustomerId, 
  placeholder = "Select a customer",
  disabled = false 
}: CustomerSelectorProps) {
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
        disabled={disabled}
      />
      
      <Select onValueChange={(value) => {
        const customer = filteredCustomers.find(c => c.id === value);
        if (customer) {
          onCustomerSelect(customer);
        }
      }} value={selectedCustomerId} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
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
