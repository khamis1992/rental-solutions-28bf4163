
import React from 'react';
import { VehicleCard } from '@/components/ui/vehicle-card';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { Skeleton } from '@/components/ui/skeleton';

interface VehicleGridProps {
  onSelectVehicle?: (id: string) => void;
  filter?: VehicleFilterParams;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ onSelectVehicle, filter }) => {
  const { useList } = useVehicles();
  const { data: vehicles, isLoading, error } = useList(filter);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden border border-border/60 rounded-lg">
            <Skeleton className="h-48 w-full" />
            <div className="p-5">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="px-5 pb-5 pt-0">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <h3 className="text-lg font-semibold">Error Loading Vehicles</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>
    );
  }

  // No vehicles found
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
        <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
        <p>No vehicles match your current criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          id={vehicle.id}
          make={vehicle.make}
          model={vehicle.model}
          year={vehicle.year}
          licensePlate={vehicle.license_plate}
          status={vehicle.status || 'available'}
          imageUrl={vehicle.image_url || ''}
          location={vehicle.location}
          fuelLevel={undefined}
          mileage={vehicle.mileage}
          onSelect={onSelectVehicle}
        />
      ))}
    </div>
  );
};

export default VehicleGrid;
