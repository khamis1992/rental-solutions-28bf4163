import React from 'react';
import { VehicleCard } from '@/components/ui/vehicle-card';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleGridProps {
  onSelectVehicle?: (id: string) => void;
  filter?: VehicleFilterParams;
  showAdd?: boolean;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ onSelectVehicle, filter, showAdd = true }) => {
  const { useList } = useVehicles();
  const { data: vehicles, isLoading, error } = useList(filter);
  const navigate = useNavigate();
  
  const handleSelect = (id: string) => {
    if (onSelectVehicle) {
      onSelectVehicle(id);
    } else {
      navigate(`/vehicles/${id}`);
    }
  };

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

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Error Loading Vehicles</h3>
        </div>
        <p className="mt-2">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </Card>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
        <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
        <p className="mb-4">No vehicles match your current criteria.</p>
        {showAdd && (
          <button 
            onClick={() => navigate('/vehicles/add')}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              "h-9 px-4 py-2"
            )}
          >
            Add New Vehicle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
      {vehicles.map(vehicle => {
        const licensePlate = vehicle.licensePlate || vehicle.license_plate || '';
        const imageUrl = vehicle.imageUrl || vehicle.image_url || '';
        const status = String(vehicle.status);
        
        return (
          <VehicleCard
            key={vehicle.id}
            id={vehicle.id}
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            licensePlate={licensePlate}
            status={status}
            imageUrl={imageUrl}
            location={vehicle.location || 'Not specified'}
            fuelLevel={vehicle.fuelLevel}
            mileage={vehicle.mileage || 0}
            onSelect={() => handleSelect(vehicle.id)}
          />
        );
      })}
    </div>
  );
};

export default VehicleGrid;
