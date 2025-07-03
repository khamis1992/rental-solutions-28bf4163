import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { formatCurrency } from '@/lib/formatters';

import { Car, Calendar, MapPin, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleGridProps {
  vehicles: any[];
  isLoading?: boolean;
  onVehicleClick: (id: string) => void;
}

// Memoized loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
    {Array.from({ length: 6 }, (_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <CardContent className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex justify-between mb-2 flex-row-reverse">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state component
const EmptyState = memo(() => (
  <div className="text-center p-8 border rounded-lg text-right" dir="rtl">
    <p className="text-muted-foreground">
      لم يتم العثور على مركبات تطابق معاييرك.
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized vehicle card component
const VehicleCard = memo(({ vehicle, onVehicleClick }: { vehicle: any; onVehicleClick: (id: string) => void }) => {
  // Memoized formatted price to avoid re-calculating on every render
  const formattedPrice = useMemo(() => {
    if (vehicle.daily_rate) {
      return `${formatCurrency(vehicle.daily_rate, true)}/يوم`;
    }
    if (vehicle.rent_amount) {
      return `${formatCurrency(vehicle.rent_amount, true)}/يوم`;
    }
    return null;
  }, [vehicle.daily_rate, vehicle.rent_amount]);

  // Memoized vehicle title
  const vehicleTitle = useMemo(() => 
    `${vehicle.make} ${vehicle.model}`, 
    [vehicle.make, vehicle.model]
  );

  // Memoized click handler
  const handleClick = useCallback(() => {
    onVehicleClick(vehicle.id);
  }, [vehicle.id, onVehicleClick]);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <div className="aspect-[16/9] relative overflow-hidden bg-muted">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={vehicleTitle}
            className="object-cover w-full h-full"
            loading="lazy" // Lazy loading for better performance
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/10">
            <Car className="h-16 w-16 text-secondary/50" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>
      <CardContent className="p-4" dir="rtl">
        <h3 className="text-lg font-semibold line-clamp-1 text-right">
          {vehicleTitle}
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground text-right">
          <div className="flex items-center gap-1 flex-row-reverse justify-end">
            <span>{vehicle.year}</span>
            <Calendar className="h-3.5 w-3.5" />
          </div>
          
          <div className="flex items-center gap-1 flex-row-reverse justify-end">
            <span>{vehicle.license_plate || 'بلا لوحة'}</span>
            <Tag className="h-3.5 w-3.5" />
          </div>
          
          {vehicle.location && (
            <div className="flex items-center gap-1 flex-row-reverse justify-end">
              <span className="line-clamp-1">{vehicle.location}</span>
              <MapPin className="h-3.5 w-3.5" />
            </div>
          )}
          
          {formattedPrice && (
            <div className="flex items-center gap-1 font-medium text-foreground flex-row-reverse justify-end">
              <span>{formattedPrice}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VehicleCard.displayName = 'VehicleCard';

const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles = [],
  isLoading = false,
  onVehicleClick,
}) => {
  const { language } = useLanguage();

  // Memoized vehicles processing
  const processedVehicles = useMemo(() => {
    if (!vehicles?.length) return [];
    
    // Sort vehicles by status priority for better UX
    return vehicles.sort((a, b) => {
      const statusPriority = {
        'available': 1,
        'reserved': 2,
        'rented': 3,
        'maintenance': 4,
        'accident': 5,
        'police_station': 6,
        'stolen': 7,
        'retired': 8
      };
      
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 9;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 9;
      
      return aPriority - bPriority;
    });
  }, [vehicles]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!processedVehicles.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
      {processedVehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onVehicleClick={onVehicleClick}
        />
      ))}
    </div>
  );
};

// Memoize the main component to prevent unnecessary re-renders
export default memo(VehicleGrid);
