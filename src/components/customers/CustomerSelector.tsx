
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
  const [error, setError] = useState<string | null>(null);

  // Fetch customers when the component mounts or when search query changes
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
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
          setError('Failed to load customers');
          setCustomers([]);
          return;
        }
        
        // Ensure data is an array before setting state
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('Error in fetchCustomers:', error);
        setError('An unexpected error occurred');
        setCustomers([]);
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

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between w-full", inputClassName)}
        >
          {selectedCustomer ? selectedCustomer.full_name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[300px]" align="start" sideOffset={4}>
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
          {error && (
            <div className="flex items-center justify-center py-4 text-destructive text-sm">
              {error}
            </div>
          )}
          {!loading && !error && safeCustomers.length === 0 && (
            <CommandEmpty>No customers found.</CommandEmpty>
          )}
          <CommandGroup>
            {!loading && !error && safeCustomers.map((customer) => (
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
