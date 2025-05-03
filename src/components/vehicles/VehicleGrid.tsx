
import React, { memo, useCallback, useMemo } from 'react';
import { VehicleCard } from '@/components/ui/vehicle-card';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, RefreshCw, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

interface VehicleGridProps {
  onSelectVehicle?: (id: string) => void;
  filter?: VehicleFilterParams;
  showAdd?: boolean;
}

// Skeleton loader component
const VehicleSkeletonCard = memo(() => (
  <div className="overflow-hidden border border-border/60 rounded-lg animate-pulse">
    <Skeleton className="h-48 w-full" />
    <div className="p-5">
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="px-5 pb-5 pt-0">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
));

VehicleSkeletonCard.displayName = 'VehicleSkeletonCard';

// Error message component
const ErrorMessage = memo(({ message }: { message: string }) => (
  <Card className="p-6 bg-red-50 border-red-200">
    <div className="flex items-center space-x-2 text-red-700">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <h3 className="text-lg font-semibold">Error Loading Vehicles</h3>
    </div>
    <p className="mt-2">{message}</p>
    <Button
      variant="outline"
      size="sm"
      className="mt-4"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </Card>
));

ErrorMessage.displayName = 'ErrorMessage';

// Empty state component
const EmptyState = memo(({ showAdd, onAddClick }: { showAdd: boolean, onAddClick: () => void }) => (
  <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Car className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
    <p className="mb-6">No vehicles match your current criteria.</p>
    {showAdd && (
      <Button onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Vehicle
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';

const VehicleGrid: React.FC<VehicleGridProps> = memo(({
  onSelectVehicle,
  filter,
  showAdd = true
}) => {
  const { useList } = useVehicles();
  const { data: vehicles = [], isLoading, error, refetch } = useList(filter);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

  // Determine number of skeleton cards based on screen size
  const skeletonCount = useMemo(() => {
    if (isMobile) return 2;
    if (isTablet) return 4;
    return 6;
  }, [isMobile, isTablet]);

  // Handle navigation to vehicle details
  const handleSelect = useCallback((id: string) => {
    if (onSelectVehicle) {
      onSelectVehicle(id);
    } else {
      navigate(`/vehicles/${id}`);
    }
  }, [onSelectVehicle, navigate]);

  // Handle add vehicle navigation
  const handleAddVehicle = useCallback(() => {
    navigate('/vehicles/add');
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <VehicleSkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'An unknown error occurred'}
      />
    );
  }

  // No vehicles found
  if (!vehicles || vehicles.length === 0) {
    return <EmptyState showAdd={showAdd} onAddClick={handleAddVehicle} />;
  }

  // Responsive grid layout
  const gridClassName = cn(
    "grid gap-6 section-transition",
    "grid-cols-1",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
    "xl:grid-cols-4"
  );

  return (
    <div className={gridClassName}>
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
          location={vehicle.location || 'Not specified'}
          fuelLevel={undefined}
          mileage={vehicle.mileage || 0}
          onSelect={() => handleSelect(vehicle.id)}
        />
      ))}
    </div>
  );
});

VehicleGrid.displayName = 'VehicleGrid';

export default VehicleGrid;
