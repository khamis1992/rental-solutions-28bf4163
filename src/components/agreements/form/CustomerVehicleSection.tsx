
import React, { useState, useEffect, useCallback } from 'react';
import { CustomerInfo } from "@/types/customer";
import VehicleSelector from "@/components/vehicles/VehicleSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CustomerVehicleSectionProps {
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo) => void;
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
  customerError?: string;
  vehicleError?: string;
}

export const CustomerVehicleSection = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle,
  customerError,
  vehicleError
}: CustomerVehicleSectionProps) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([] as CustomerInfo[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search to prevent too many requests
  const debouncedFetch = useCallback((query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    setIsLoading(true);
    
    // Small delay to prevent too many requests while typing
    const timeoutId = setTimeout(() => {
      fetchCustomers(query);
    }, 300); 
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Effect to trigger search when query changes
  useEffect(() => {
    const cleanup = debouncedFetch(searchQuery);
    return cleanup;
  }, [searchQuery, debouncedFetch]);

  const fetchCustomers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .ilike('full_name', `%${query}%`)
        .eq('role', 'customer' as any) // Type assertion to resolve the type issue
        .order('full_name')
        .limit(10);

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        setCustomers([]);
        return;
      }

      // Safely handle the data
      if (data && Array.isArray(data)) {
        const typedCustomers = data.map(item => ({
          id: item.id,
          full_name: item.full_name || '',
          email: item.email || '',
          phone_number: item.phone_number || '',
          // Add other required fields with defaults
          driver_license: '',
          nationality: '',
          address: ''
        }));
        setCustomers(typedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Customer & Vehicle</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Customer
        </label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedCustomer ? selectedCustomer.full_name : "Search for customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start" sideOffset={4}>
            <Command>
              <CommandInput
                placeholder="Search customer by name..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? 'Loading...' : (
                    searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No customer found'
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {safeCustomers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.full_name}
                      onSelect={() => {
                        setSelectedCustomer(customer);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <span className="flex-1">{customer.full_name}</span>
                      {customer.phone_number && (
                        <span className="text-xs text-muted-foreground">
                          ({customer.phone_number})
                        </span>
                      )}
                      {selectedCustomer?.id === customer.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {customerError && (
          <Alert variant="destructive" className="py-2 mt-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm ml-2">
              {customerError}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vehicle
        </label>
        <VehicleSelector
          selectedVehicle={selectedVehicle}
          onVehicleSelect={setSelectedVehicle}
          placeholder="Select vehicle"
        />
        {vehicleError && (
          <Alert variant="destructive" className="py-2 mt-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm ml-2">
              {vehicleError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
