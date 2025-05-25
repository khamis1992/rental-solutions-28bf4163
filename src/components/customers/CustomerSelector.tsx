
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';
import { CustomerInfo } from '@/types/customer';

interface CustomerSelectorProps {
  onCustomerSelect: (customer: CustomerInfo) => void;
  selectedCustomer: CustomerInfo | null;
  placeholder?: string;
  disabled?: boolean;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  onCustomerSelect,
  selectedCustomer,
  placeholder = "Search customers...",
  disabled = false
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { customers, isLoading } = useCustomers(searchQuery);

  // Clear selection
  const handleClearSelection = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onCustomerSelect({
      id: '',
      full_name: '',
      email: '',
      phone_number: '',
      driver_license: '',
      nationality: '',
      address: ''
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCustomer?.full_name ? (
            <div className="flex items-center justify-between w-full">
              <span>{selectedCustomer.full_name}</span>
              <X 
                className="h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={handleClearSelection} 
              />
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search customers..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => {
                      onCustomerSelect({
                        id: customer.id || '',
                        full_name: customer.full_name || '',
                        email: customer.email || '',
                        phone_number: customer.phone || '',
                        driver_license: customer.driver_license || '',
                        nationality: customer.nationality || '',
                        address: customer.address || ''
                      });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {customer.phone}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerSelector;
