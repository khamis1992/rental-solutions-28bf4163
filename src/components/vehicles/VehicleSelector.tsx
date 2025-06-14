
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  placeholder?: string;
  disabled?: boolean;
}

const VehicleSelector = ({
  selectedVehicle,
  onVehicleSelect,
  placeholder = "Search for a vehicle...",
  disabled = false
}: VehicleSelectorProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading, error } = vehiclesHook.useList();

  // Filter vehicles based on search query locally for better UX
  const filteredVehicles = (vehicles || []).filter(vehicle => {
    if (!internalSearchQuery.trim()) return true;
    
    const searchTerm = internalSearchQuery.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(searchTerm) ||
      vehicle.model?.toLowerCase().includes(searchTerm) ||
      vehicle.license_plate?.toLowerCase().includes(searchTerm) ||
      vehicle.vin?.toLowerCase().includes(searchTerm) ||
      vehicle.year?.toString().includes(searchTerm)
    );
  });

  // Handle vehicle selection
  const handleSelect = (vehicleSearchText: string): void => {
    // Extract vehicle ID from the search text format: "make|model|license_plate|id"
    const parts = vehicleSearchText.split('|');
    const vehicleId = parts[parts.length - 1]; // ID is always last
    
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    if (vehicle) {
      console.log('Vehicle selected:', vehicle);
      onVehicleSelect(vehicle);
    }
    setOpen(false);
    setInternalSearchQuery(''); // Clear search after selection
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      console.log('Manual refresh triggered');
      toast.success('Vehicle list refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh vehicle list');
    }
  };

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error('VehicleSelector error:', error);
    }
  }, [error]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between w-full")}
        >
          {selectedVehicle ? 
            `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.license_plate})` : 
            placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[400px]" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search vehicles..."
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
                <span className="ml-2 text-sm text-muted-foreground">Loading vehicles...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-4 px-3 space-y-2">
                <div className="flex items-center text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Error loading vehicles
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}
            {!isLoading && !error && filteredVehicles.length === 0 && (
              <CommandEmpty>
                {internalSearchQuery.trim() 
                  ? `No vehicles found matching "${internalSearchQuery}"`
                  : 'No vehicles available.'
                }
              </CommandEmpty>
            )}
            {!error && (
              <CommandGroup>
                {!isLoading && filteredVehicles.map((vehicle) => {
                  // Create a searchable value that includes make, model, license plate, and ID
                  const searchableValue = `${vehicle.make}|${vehicle.model}|${vehicle.license_plate}|${vehicle.id}`;
                  
                  return (
                    <CommandItem
                      key={vehicle.id}
                      value={searchableValue}
                      onSelect={() => handleSelect(searchableValue)}
                      className="flex flex-col items-start py-3 px-3 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Year: {vehicle.year || 'N/A'} • VIN: {vehicle.vin ? vehicle.vin.substring(0, 10) + '...' : 'N/A'}
                          </span>
                        </div>
                        {selectedVehicle?.id === vehicle.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleSelector;
