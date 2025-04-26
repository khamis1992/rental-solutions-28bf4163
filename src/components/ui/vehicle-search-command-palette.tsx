
import React, { useState, useEffect } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader } from "@/components/ui/loader";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Vehicle } from "@/types/vehicle";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asVehicleIdColumn } from '@/utils/database-type-helpers';

interface VehicleSearchCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleSelect: (vehicle: Vehicle) => void;
  vehicles: Vehicle[];
  isLoading?: boolean;
}

export function VehicleSearchCommandPalette({
  isOpen,
  onClose,
  onVehicleSelect,
  vehicles: initialVehicles,
  isLoading: initialLoading = false,
}: VehicleSearchCommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    const searchVehicles = async () => {
      if (!search || search.length < 2) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .or(`license_plate.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,vin.ilike.%${search}%`)
          .order('make', { ascending: true });
        
        if (error) {
          console.error('Error searching vehicles:', error);
          toast.error('Failed to search vehicles');
          return;
        }
        
        if (data) {
          setVehicles(data as Vehicle[]);
        }
      } catch (err) {
        console.error('Error in vehicle search:', err);
        toast.error('An error occurred while searching vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (search) {
        searchVehicles();
      } else {
        setVehicles(initialVehicles);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, initialVehicles]);

  const filteredVehicles = React.useMemo(() => {
    if (!search) return vehicles;

    const searchLower = search.toLowerCase();
    return vehicles.filter((vehicle) => {
      return (
        vehicle.license_plate?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.vin?.toLowerCase().includes(searchLower) ||
        vehicle.year?.toString().includes(searchLower)
      );
    });
  }, [vehicles, search]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search vehicles by plate, make, model..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader className="h-4 w-4 animate-spin" />
                Loading vehicles...
              </div>
            ) : (
              "No vehicles found."
            )}
          </CommandEmpty>
          <CommandGroup heading="Available Vehicles">
            {filteredVehicles.map((vehicle) => (
              <CommandItem
                key={vehicle.id}
                onSelect={() => {
                  onVehicleSelect(vehicle);
                  onClose();
                }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Plate: {vehicle.license_plate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {vehicle.status === "available" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">
                    {vehicle.rent_amount ? `${vehicle.rent_amount} QAR` : "No price set"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
