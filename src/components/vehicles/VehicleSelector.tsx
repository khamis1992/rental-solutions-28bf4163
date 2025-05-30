import React, { useState } from 'react';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Vehicle } from '@/types/vehicle';
import { VehicleFilterParams } from '@/services/VehicleService';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
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
  const { vehicles = [], isLoadingVehicles } = useVehicleService({
    filters: {
      status: 'available',
      search: searchQuery.length >= 2 ? searchQuery : undefined
    }
  });

  const handleSelect = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoadingVehicles}
        >
          {isLoadingVehicles ? (
            <Skeleton className="h-4 w-[200px]" />
          ) : selectedVehicle ? (
            `${selectedVehicle.make} ${selectedVehicle.model} - ${selectedVehicle.license_plate}`
          ) : (
            placeholder
          )}
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
          <CommandEmpty>No vehicles found.</CommandEmpty>
          <CommandGroup>
            {(vehicles ?? []).map((vehicle) => (
              <CommandItem
                key={vehicle.id}
                value={vehicle.id}
                onSelect={() => handleSelect(vehicle)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {vehicle.make} {vehicle.model} - {vehicle.license_plate}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleSelector;
