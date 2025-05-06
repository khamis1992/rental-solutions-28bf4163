
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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVehicleService } from "@/hooks/services/useVehicleService";

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
  const { vehicles, isLoading, error, setFilters } = useVehicleService({
    statuses: ['available']
  });

  useEffect(() => {
    // Set filter to only show available vehicles
    setFilters({
      statuses: ['available']
    });
  }, [setFilters]);

  const handleSelect = (vehicle: any) => {
    onVehicleSelect(vehicle);
    setOpen(false);
  };

  // Ensure vehicles is always an array, even if the service returns undefined
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

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
          {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.license_plate})` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search vehicles..." />
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <CommandEmpty>
                {error ? "Error loading vehicles" : "No vehicles found."}
              </CommandEmpty>
              <ScrollArea className="h-72">
                <CommandGroup>
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
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleSelector;
