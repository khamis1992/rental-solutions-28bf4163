
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomerInfo } from '@/types/customer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AgreementSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo | null) => void;
  setSearchParams: (params: Record<string, any>) => void;
}

export function AgreementSearch({
  searchQuery,
  setSearchQuery,
  selectedCustomer,
  setSelectedCustomer,
  setSearchParams,
}: AgreementSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', inputValue],
    queryFn: async () => {
      if (!inputValue || inputValue.length < 2) return [];
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .or(`full_name.ilike.%${inputValue}%,email.ilike.%${inputValue}%,phone_number.ilike.%${inputValue}%`)
        .limit(5);
        
      return data || [];
    },
    enabled: inputValue.length >= 2,
  });

  // Handle direct search query input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (!value) {
      // Clear customer selection if search is cleared
      setSelectedCustomer(null);
      setSearchParams({ customer_id: undefined });
    }
  };

  // Handle search submission
  const handleSearch = () => {
    setSearchQuery(inputValue);
    
    if (inputValue && !selectedCustomer) {
      // Search by query text
      setSearchParams({ query: inputValue, customer_id: undefined });
    }
  };

  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setInputValue(customer.full_name);
    setOpen(false);
    setSearchParams({ customer_id: customer.id, query: undefined });
  };

  // Clear search and selection
  const handleClearSearch = () => {
    setInputValue('');
    setSelectedCustomer(null);
    setSearchQuery('');
    setSearchParams({ customer_id: undefined, query: undefined });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Enter key for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search agreements or select customer..."
              className="pl-10 pr-10"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onClick={() => inputValue.length >= 2 && setOpen(true)}
            />
          </PopoverTrigger>
          
          <PopoverContent className="p-0 w-[300px]" align="start">
            <Command>
              <CommandInput 
                placeholder="Search customers..." 
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? 'Searching...' : 'No customers found'}
                </CommandEmpty>
                <CommandGroup heading="Customers">
                  {customers?.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => handleSelectCustomer(customer)}
                      className="flex items-center gap-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span>{customer.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.email || customer.phone_number}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {inputValue && (
          <button
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClearSearch}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedCustomer && (
        <div className="absolute top-full left-0 mt-2 flex items-center">
          <Badge variant="secondary" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {selectedCustomer.full_name}
            <button className="ml-1 rounded-full hover:bg-muted" onClick={handleClearSearch}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
