
import React, { useState, useEffect } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Loader2, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { cn } from '@/lib/utils';

interface VehicleSearchSelectProps {
  onVehicleSelect: (vehicleId: string) => void;
  selectedVehicleId?: string;
  disabled?: boolean;
  placeholder?: string;
}

const VehicleSearchSelect: React.FC<VehicleSearchSelectProps> = ({
  onVehicleSelect,
  selectedVehicleId,
  disabled = false,
  placeholder = 'Search vehicles...'
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { vehicles, isLoading } = useVehicles().useSearchVehicles(debouncedSearch);
  
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // Find the currently selected vehicle based on ID
  useEffect(() => {
    if (selectedVehicleId && vehicles) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    } else if (!selectedVehicleId) {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles]);
  
  const handleSelect = (vehicleId: string) => {
    onVehicleSelect(vehicleId);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-left font-normal"
        >
          {selectedVehicle ? (
            <div className="flex items-center justify-between w-full">
              <span>
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.license_plate})
              </span>
              <VehicleStatusBadge status={selectedVehicle.status || 'available'} size="sm" />
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput 
            placeholder="Search by make, model, or plate..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            )}
            {!isLoading && (
              <>
                <CommandEmpty>No vehicles found.</CommandEmpty>
                <CommandGroup>
                  {vehicles.map((vehicle) => (
                    <CommandItem
                      key={vehicle.id}
                      onSelect={() => handleSelect(vehicle.id)}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <span>{vehicle.make} {vehicle.model}</span>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.license_plate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <VehicleStatusBadge 
                          status={vehicle.status || 'available'} 
                          size="sm" 
                        />
                        {selectedVehicleId === vehicle.id && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleSearchSelect;
