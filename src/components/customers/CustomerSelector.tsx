
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerInfo } from '@/types/customer';
import { supabase } from '@/lib/supabase';

interface CustomerSelectorProps {
  onCustomerSelect: (customer: CustomerInfo) => void;
  selectedCustomer: CustomerInfo | null;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CustomerSelector = ({
  onCustomerSelect,
  selectedCustomer,
  inputClassName,
  placeholder = "Select a customer",
  disabled = false
}: CustomerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers when the component mounts or when search query changes
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('role', 'customer')
          .order('full_name');
          
        if (searchQuery) {
          query = query.ilike('full_name', `%${searchQuery}%`);
        }
        
        const { data, error } = await query.limit(20);
        
        if (error) {
          console.error('Error fetching customers:', error);
          return;
        }
        
        // Ensure all required fields are present, use default values for missing ones
        const formattedCustomers = (data || []).map(item => ({
          id: item.id || '',
          full_name: item.full_name || 'Unknown',
          email: item.email || '',
          phone_number: item.phone_number || '',
        }));
        
        setCustomers(formattedCustomers as CustomerInfo[]);
      } catch (error) {
        console.error('Error in fetchCustomers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [searchQuery]);

  const handleSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      onCustomerSelect(customer);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between", inputClassName)}
        >
          {selectedCustomer ? selectedCustomer.full_name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={4} style={{ width: '350px' }}>
        <Command>
          <CommandInput 
            placeholder="Search for customers..." 
            onValueChange={setSearchQuery}
            value={searchQuery}
          />
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && (
            <CommandEmpty>No customers found.</CommandEmpty>
          )}
          <CommandGroup>
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => handleSelect(customer.id)}
                className="flex items-center"
              >
                <span className="flex-1 truncate">
                  {customer.full_name}
                  {customer.phone_number && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({customer.phone_number})
                    </span>
                  )}
                </span>
                {selectedCustomer?.id === customer.id && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerSelector;
