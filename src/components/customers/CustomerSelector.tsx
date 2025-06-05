
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerInfo } from '@/types/customer';
import { useCustomerSelectorService } from '@/hooks/services/useCustomerSelectorService';
import { toast } from 'sonner';

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
  const [open, setOpen] = useState<boolean>(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  
  const {
    customers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshCustomers
  } = useCustomerSelectorService();

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(internalSearchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [internalSearchQuery, setSearchQuery]);

  // Filter customers based on search query locally for better UX
  const filteredCustomers = customers.filter(customer => {
    if (!internalSearchQuery.trim()) return true;
    
    const searchTerm = internalSearchQuery.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone_number.toLowerCase().includes(searchTerm)
    );
  });

  // Handle customer selection
  const handleSelect = (customerSearchText: string): void => {
    // Extract customer ID from the search text format: "name|email|phone|id"
    const parts = customerSearchText.split('|');
    const customerId = parts[parts.length - 1]; // ID is always last
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      console.log('Customer selected:', customer);
      onCustomerSelect(customer);
    }
    setOpen(false);
    setInternalSearchQuery(''); // Clear search after selection
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refreshCustomers();
      toast.success('Customer list refreshed');
    } catch (error) {
      toast.error('Failed to refresh customer list');
      console.error('Refresh error:', error);
    }
  };

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
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search for customers..."
              onValueChange={(value) => {
                console.log('Search input changed:', value);
                setInternalSearchQuery(value);
              }}
              value={internalSearchQuery}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-2 h-8 w-8 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading customers...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center py-4 text-destructive text-sm">
                Error loading customers
              </div>
            )}
            {!isLoading && !error && filteredCustomers.length === 0 && (
              <CommandEmpty>
                {internalSearchQuery.trim() 
                  ? `No customers found matching "${internalSearchQuery}"`
                  : 'No customers available.'
                }
              </CommandEmpty>
            )}
            <CommandGroup>
              {!isLoading && !error && filteredCustomers.map((customer) => {
                // Create a searchable value that includes name, email, phone, and ID
                const searchableValue = `${customer.full_name}|${customer.email}|${customer.phone_number}|${customer.id}`;
                
                return (
                  <CommandItem
                    key={customer.id}
                    value={searchableValue}
                    onSelect={() => handleSelect(searchableValue)}
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
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerSelector;
