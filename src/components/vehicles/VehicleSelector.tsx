
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVehicleService } from "@/hooks/services/useVehicleService";
import { Vehicle } from '@/types/vehicle';

interface VehicleSelectorProps {
  selectedVehicle: any;
  onVehicleSelect: (vehicle: any) => void;
  placeholder?: string;
  disabled?: boolean;
}

const VehicleSelector = ({
  selectedVehicle,
  onVehicleSelect,
  placeholder = "Select vehicle",
  disabled = false
}: VehicleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { vehicles, isLoading, error, setFilters } = useVehicleService({
    statuses: ['available']
  });

  // Update filters when search query changes
  useEffect(() => {
    const filters: any = {
      statuses: ['available']
    };
    
    if (searchQuery && searchQuery.length >= 2) {
      filters.search = searchQuery;
    }
    
    setFilters(filters);
  }, [searchQuery, setFilters]);

  const handleSelect = (vehicle: any) => {
    onVehicleSelect(vehicle);
    setOpen(false);
  };

  // Transform raw vehicle data to ensure it matches expected structure
  const safeVehicles = Array.isArray(vehicles) ? vehicles.map((vehicle: any) => ({
    ...vehicle,
    vin: vehicle.vin || vehicle.engine_number || vehicle.id || 'N/A',
    mileage: vehicle.mileage || 0,
    rent_amount: vehicle.rent_amount || 0
  })) : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.license_plate})` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search vehicles..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {error ? "Error loading vehicles" : 
                    searchQuery.length < 2 ? "Enter at least 2 characters to search" : "No vehicles found"
                  }
                </CommandEmpty>
                <CommandGroup>
                  {safeVehicles.length > 0 ? (
                    <ScrollArea className="h-72">
                      {safeVehicles.map((vehicle) => (
                        <CommandItem
                          key={vehicle.id}
                          value={`${vehicle.make} ${vehicle.model} ${vehicle.license_plate}`}
                          onSelect={() => handleSelect(vehicle)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{vehicle.make} {vehicle.model} ({vehicle.license_plate})</span>
                            <span className="text-xs text-muted-foreground">
                              Year: {vehicle.year} • VIN: {vehicle.vin?.substring(0, 8)}...
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="py-6 text-center text-sm">
                      {searchQuery.length < 2 
                        ? "Enter at least 2 characters to search" 
                        : "No available vehicles found"}
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleSelector;
