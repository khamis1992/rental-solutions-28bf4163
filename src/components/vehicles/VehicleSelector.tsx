import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedVehicle } from '@/types/vehicle';
import { useVehicles } from '@/hooks/vehicles/useVehicles';
import { toast } from 'sonner';
import { vehicleService } from '@/services/VehicleService';
import { enhancedVehicleSearch, isLicensePlatePattern } from '@/utils/searchUtils';

interface VehicleSelectorProps {
  selectedVehicle?: ExtendedVehicle | null;
  onVehicleSelect: (vehicle: ExtendedVehicle) => void;
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
  const [enhancedResults, setEnhancedResults] = useState<ExtendedVehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading, error } = vehiclesHook.useList();

  // Enhanced search function
  const performEnhancedSearch = async (searchTerm: string) => {
    setIsSearching(true);
    try {
      // Use search method from vehicle service
      const result = await vehicleService.searchVehicles(searchTerm);

      if (result.success) {
        setEnhancedResults(result.data);
      } else {
        console.error('Enhanced search failed:', result.error);
        setEnhancedResults([]);
      }
    } catch (error) {
      console.error('Enhanced search error:', error);
      setEnhancedResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (internalSearchQuery.trim()) {
        performEnhancedSearch(internalSearchQuery);
      } else {
        setEnhancedResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [internalSearchQuery]);

  // Filter vehicles based on search query locally for better UX
  const getFilteredVehicles = () => {
    // If we have enhanced search results, use those
    if (internalSearchQuery.trim() && enhancedResults.length > 0) {
      return enhancedResults;
    }

    // If searching but no enhanced results yet, show loading or fallback to local filter
    if (internalSearchQuery.trim() && isSearching) {
      return []; // Show loading state
    }

    // Local filtering for immediate feedback
    if (!internalSearchQuery.trim()) {
      return vehicles || [];
    }

    return (vehicles || []).filter(vehicle => {
      const searchTerm = internalSearchQuery.toLowerCase();
      return (
        vehicle.make?.toLowerCase().includes(searchTerm) ||
        vehicle.model?.toLowerCase().includes(searchTerm) ||
        vehicle.license_plate?.toLowerCase().includes(searchTerm) ||
        vehicle.vin?.toLowerCase().includes(searchTerm) ||
        vehicle.year?.toString().includes(searchTerm)
      );
    });
  };

  const filteredVehicles = getFilteredVehicles();

  // Handle vehicle selection
  const handleSelect = (vehicleSearchText: string): void => {
    // Extract vehicle ID from the search text format: "make|model|license_plate|id"
    const parts = vehicleSearchText.split('|');
    const vehicleId = parts[parts.length - 1]; // ID is always last
    
    // Look in both regular vehicles and enhanced results
    const allVehicles = [...(vehicles || []), ...enhancedResults];
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    
    if (vehicle) {
      console.log('Vehicle selected:', vehicle);
      onVehicleSelect(vehicle);
      
      // Show success message with match type if from enhanced search
      const isEnhancedResult = enhancedResults.some(v => v.id === vehicleId);
      if (isEnhancedResult && isLicensePlatePattern(internalSearchQuery)) {
        toast.success('Vehicle found with enhanced license plate matching');
      }
    }
    setOpen(false);
    setInternalSearchQuery(''); // Clear search after selection
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      console.log('Manual refresh triggered');
      setEnhancedResults([]); // Clear enhanced results
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
              placeholder="Search vehicles (supports fuzzy license plate matching)..."
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
              disabled={isLoading || isSearching}
            >
              <RefreshCw className={cn("h-4 w-4", (isLoading || isSearching) && "animate-spin")} />
            </Button>
          </div>
          
          <CommandList>
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading vehicles...
              </div>
            )}
            
            {isSearching && internalSearchQuery.trim() && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching with enhanced matching...
              </div>
            )}
            
            {error && (
              <div className="p-4 text-center text-sm text-red-500">
                Error loading vehicles. Please try refreshing.
              </div>
            )}
            
            {!isLoading && !isSearching && filteredVehicles.length === 0 && internalSearchQuery.trim() && (
              <CommandEmpty>
                No vehicles found. Try a different search term or check the license plate.
              </CommandEmpty>
            )}
            
            {!error && (
              <CommandGroup>
                {!isLoading && !isSearching && filteredVehicles.map((vehicle) => {
                  // Create a searchable value that includes make, model, license plate, and ID
                  const searchableValue = `${vehicle.make}|${vehicle.model}|${vehicle.license_plate}|${vehicle.id}`;
                  
                  // Check if this is from enhanced search
                  const isEnhancedResult = enhancedResults.some(v => v.id === vehicle.id);
                  
                  return (
                    <CommandItem
                      key={vehicle.id}
                      value={searchableValue}
                      onSelect={() => handleSelect(searchableValue)}
                      className="flex flex-col items-start py-3 px-3 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                            </span>
                            {isEnhancedResult && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Enhanced Match
                              </span>
                            )}
                          </div>
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
