
import React, { useState, useEffect } from 'react';
import { CustomerInfo } from "@/types/customer";
import VehicleSelector from "@/components/vehicles/VehicleSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface CustomerVehicleSectionProps {
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo) => void;
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
  customerError?: string;
  vehicleError?: string;
}

export const CustomerVehicleSection: React.FC<CustomerVehicleSectionProps> = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle,
  customerError,
  vehicleError
}) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (searchQuery.length < 2) {
        setCustomers([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('role', 'customer')
          .ilike('full_name', `%${searchQuery}%`)
          .order('full_name')
          .limit(10);

        if (error) {
          console.error('Error fetching customers:', error);
          setCustomers([]);
          return;
        }

        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [searchQuery]);

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
              <CommandEmpty>
                {isLoading ? 'Loading...' : (
                  searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No customer found'
                )}
              </CommandEmpty>
              <CommandGroup>
                {safeCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
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
